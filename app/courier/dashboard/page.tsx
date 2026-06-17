// app/courier/dashboard/page.tsx - ЧУТЬ СВЕТЛЕЙ ТЕМА
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const CourierMap = dynamic(() => import('../../components/CourierMap'), { ssr: false });

// ============ ИКОНКИ ============
const CarIcon = ({ size = 24, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500/70">
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M5 17a2 2 0 1 0 4 0M19 17a2 2 0 1 0-4 0" />
      <path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  </div>
);

const LocationIcon = ({ size = 24, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500/70">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  </div>
);

const OnlineIcon = ({ isOnline = false }) => (
  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
);

export default function CourierDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_WS_RECONNECT_ATTEMPTS = 3;
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);
  const [wsFailed, setWsFailed] = useState(false);

  // ============ ВСЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ) ============
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dlat = (lat2 - lat1) * Math.PI / 180;
    const dlon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dlon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('courierToken');
      const courierData = sessionStorage.getItem('courier');
      
      if (!token || !courierData) {
        router.push('/courier/login');
        return;
      }
      
      try {
        const response = await fetch(`/api/courier/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
          sessionStorage.removeItem('courierToken');
          sessionStorage.removeItem('courier');
          router.push('/courier/login');
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            if (!data.is_verified) {
              setLoading(false);
              return;
            }
            
            setStatus(data);
            setIsOnline(data.is_online);
            setOrderStatus(data.current_order_status);
            
            sessionStorage.setItem('courier', JSON.stringify(data));
            
            if (data.is_online && !locationIntervalRef.current) {
              startLocationTracking();
              connectWebSocket();
            }
            
            if (data.current_order_id) {
              fetchCurrentOrder(data.current_order_id);
            }
            
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/courier/login');
      }
    };
    
    checkAuth();
    
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [router]);

  // Heartbeat
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
    return () => clearInterval(heartbeat);
  }, []);

  // Геолокация
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const connectWebSocket = () => {
    const token = sessionStorage.getItem('courierToken');
    if (!token || wsFailed || wsReconnectAttempts >= MAX_WS_RECONNECT_ATTEMPTS) return;
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    
    const wsUrl = `wss://toogood-2ncf.onrender.com/ws/courier-tracking?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let lastPongTime = Date.now();
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setWsReconnectAttempts(0);
      setWsFailed(false);
      lastPongTime = Date.now();
      
      heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          if (Date.now() - lastPongTime > 45000) {
            ws.close();
            return;
          }
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
          lastPongTime = Date.now();
          return;
        }
        if (data.type === 'new_order') {
          showNotification('🆕 Новый заказ!', 'info');
        }
        if (data.type === 'order_assigned') {
          showNotification('✅ Заказ назначен!', 'success');
          fetchStatus();
          if (data.order_id) fetchCurrentOrder(data.order_id);
        }
      } catch (error) {}
    };
    
    ws.onclose = () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (isOnline && !wsFailed && wsReconnectAttempts < MAX_WS_RECONNECT_ATTEMPTS) {
        const newAttempts = wsReconnectAttempts + 1;
        setWsReconnectAttempts(newAttempts);
        setTimeout(() => { if (isOnline) connectWebSocket(); }, 5000 * newAttempts);
      }
    };
  };

  const startLocationTracking = () => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    
    locationIntervalRef.current = setInterval(() => {
      if (navigator.geolocation && isOnline) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setUserLocation({ lat, lon });
            
            const token = sessionStorage.getItem('courierToken');
            try {
              await fetch(`/api/courier/update-location`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ lat, lon })
              });
            } catch (error) {}
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: "update_location",
                lat: lat,
                lon: lon
              }));
            }
          },
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      }
    }, 3000);
  };

  const centerToMyLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          window.dispatchEvent(new CustomEvent('centerMap', { 
            detail: { lat: latitude, lon: longitude, zoom: 16 }
          }));
          setLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Не удалось определить местоположение');
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Геолокация не поддерживается');
      setLocating(false);
    }
  };

  const fetchStatus = async () => {
    const token = sessionStorage.getItem('courierToken');
    if (!token) return;
    try {
      const res = await fetch(`/api/courier/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsOnline(data.is_online);
        setStatus(data);
        setOrderStatus(data.current_order_status);
        if (data.current_order_id) {
          fetchCurrentOrder(data.current_order_id);
        }
      }
    } catch (error) {}
  };

  const fetchCurrentOrder = async (orderId: number) => {
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCurrentOrder(data);
    } catch (error) {}
  };

  const toggleOnlineMode = async () => {
    if (switching) return;
    setSwitching(true);
    
    const token = sessionStorage.getItem('courierToken');
    
    if (!isOnline) {
      if (!navigator.geolocation) {
        alert('Разрешите доступ к геолокации');
        setSwitching(false);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`/api/courier/go-online`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                lat: position.coords.latitude,
                lon: position.coords.longitude
              })
            });
            const data = await res.json();
            if (data.success) {
              setIsOnline(true);
              startLocationTracking();
              connectWebSocket();
            } else {
              alert(data.message || 'Ошибка');
            }
          } catch (error) {
            alert('Ошибка при выходе на линию');
          } finally {
            setSwitching(false);
          }
        },
        () => {
          alert('Разрешите доступ к геолокации');
          setSwitching(false);
        }
      );
    } else {
      try {
        const res = await fetch(`/api/courier/go-offline`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setIsOnline(false);
          if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
          }
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        }
      } catch (error) {
        alert('Ошибка при уходе с линии');
      } finally {
        setSwitching(false);
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'almost_done': return '🔔 Почти закончил';
      case 'delivering': return '🚚 Доставка';
      case 'assigned': return '📦 Заказ назначен';
      case 'nearby': return '📍 Рядом с клиентом';
      default: return '✅ На линии';
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-4 right-4 z-50 p-3 rounded-xl text-white text-center text-sm ${
      type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } animate-slide-up`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const goToProfile = () => {
    router.push('/profile');
  };

  // ============ ЗАГРУЗКА ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  // ============ ОСНОВНОЙ JSX - ЧУТЬ СВЕТЛЕЙ ============
  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      {/* HEADER */}
      <div className="bg-white/95 backdrop-blur border-b border-gray-200 px-6 pt-12 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
              <CarIcon size={28} />
              Панель курьера
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {status?.first_name} {status?.last_name}
            </p>
            {userLocation && (
              <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                <span className="text-emerald-500">●</span>
                {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
              </p>
            )}
          </div>
          <button onClick={goToProfile} className="bg-gray-100 hover:bg-gray-200 rounded-full p-2.5 transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* КАРТА */}
      <div className="relative h-72 mx-4 mt-4 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <CourierMap
          orderId={currentOrder?.id}
          restaurantLocation={currentOrder?.supplier ? { lat: currentOrder.supplier.lat, lon: currentOrder.supplier.lon } : undefined}
          customerLocation={currentOrder?.customer_lat ? { lat: currentOrder.customer_lat, lon: currentOrder.customer_lon } : undefined}
          height="100%"
        />
        
        <button
          onClick={centerToMyLocation}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur rounded-full shadow-lg p-3 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50 border border-gray-200"
        >
          {locating ? (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LocationIcon size={20} />
          )}
        </button>
      </div>

      {/* СТАТУС ОНЛАЙН */}
      <div className="px-4 mt-4">
        <div className="bg-white/95 backdrop-blur rounded-2xl p-5 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <OnlineIcon isOnline={isOnline} />
                {isOnline && <div className="absolute -inset-1 bg-emerald-400/20 rounded-full animate-ping" />}
              </div>
              <div>
                <p className={`font-semibold text-lg ${isOnline ? 'text-gray-800' : 'text-gray-400'}`}>
                  {isOnline ? 'На линии' : 'Офлайн'}
                </p>
                <p className="text-xs text-gray-500">
                  {isOnline ? 'Готов принимать заказы' : 'Включите режим'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleOnlineMode}
              disabled={switching}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'} ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-xs font-bold ${isOnline ? 'translate-x-6' : 'translate-x-0'}`}>
                {isOnline ? '✓' : '✕'}
              </span>
            </button>
          </div>
          
          {isOnline && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Статус:</span>
                <span className="text-emerald-500 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Принимаю заказы
                </span>
              </div>
              {orderStatus && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Текущий статус:</span>
                  <span className="text-blue-500 font-medium">{getStatusText(orderStatus)}</span>
                </div>
              )}
            </div>
          )}
          
          {!isOnline && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-400 text-center">💤 Нажмите на ползунок чтобы выйти на линию</p>
            </div>
          )}
        </div>
      </div>

      {/* ТЕКУЩИЙ ЗАКАЗ */}
      {currentOrder && currentOrder.status !== 'delivered' && currentOrder.status !== 'cancelled' && (
        <div className="px-4 mt-4 pb-32">
          <div className="bg-white/95 backdrop-blur rounded-2xl p-5 shadow-lg border border-gray-200">
            <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              📦 Текущий заказ #{currentOrder.order_number}
            </h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-500">Ресторан:</span>
                <span className="font-medium text-gray-800 text-right">{currentOrder.supplier?.business_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-gray-500">Клиент:</span>
                <span className="font-medium text-gray-800 text-right">{currentOrder.customer_address || 'Адрес не указан'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Сумма:</span>
                <span className="font-bold text-emerald-500 text-lg">{currentOrder.amount_paid} ₸</span>
              </div>
            </div>
            
            {currentOrder.status === 'ready_for_pickup' && (
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold transition disabled:opacity-50">
                📦 Забрал заказ из ресторана
              </button>
            )}
            
            {currentOrder.status === 'picked_up' && (
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-semibold transition disabled:opacity-50">
                🚗 Я приехал
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}