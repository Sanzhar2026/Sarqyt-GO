// app/courier/dashboard/page.tsx - ТОЧНО КАК inDRIVER
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const CourierMap = dynamic(() => import('../../components/CourierMap'), { ssr: false });

// ============ ИКОНКИ (ТОЛЬКО SVG) ============
const CarIcon = ({ size = 24, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M5 17a2 2 0 1 0 4 0M19 17a2 2 0 1 0-4 0" />
      <path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  </div>
);

const OnlineIcon = ({ isOnline = false }) => (
  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
);

const CloseIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export default function CourierDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_WS_RECONNECT_ATTEMPTS = 3;
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);
  const [wsFailed, setWsFailed] = useState(false);

  // ============ ВСЕ ФУНКЦИИ ============
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-400 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  // ============ ОСНОВНОЙ JSX - КАРТА НА ВСЮ СТРАНИЦУ ============
  return (
    <div className="fixed inset-0 bg-gray-900">
      {/* КАРТА НА ВСЮ СТРАНИЦУ */}
      <CourierMap
        orderId={currentOrder?.id}
        restaurantLocation={currentOrder?.supplier ? { 
          lat: currentOrder.supplier.lat, 
          lon: currentOrder.supplier.lon 
        } : undefined}
        customerLocation={currentOrder?.customer_lat ? { 
          lat: currentOrder.customer_lat, 
          lon: currentOrder.customer_lon 
        } : undefined}
        height="100vh"
      />

      {/* ============ ВЕРХНЯЯ ПАНЕЛЬ (как inDriver) ============ */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex justify-between items-center pointer-events-auto">
          <button onClick={goToProfile} className="w-10 h-10 bg-gray-800/80 backdrop-blur rounded-full flex items-center justify-center border border-gray-600/50">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 bg-gray-800/80 backdrop-blur rounded-full px-3 py-1.5 border border-gray-600/50">
              <OnlineIcon isOnline={isOnline} />
              <span className="text-white text-xs font-medium">
                {isOnline ? 'На линии' : 'Офлайн'}
              </span>
            </div>
            <button
              onClick={toggleOnlineMode}
              disabled={switching}
              className={`pointer-events-auto px-3 py-1.5 rounded-full text-xs font-medium transition ${
                isOnline 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {isOnline ? 'Выключить' : 'Включить'}
            </button>
          </div>
        </div>
        
        {userLocation && (
          <div className="pointer-events-auto mt-2">
            <p className="text-gray-400 text-xs">
              📍 {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* ============ НИЖНЯЯ ПАНЕЛЬ (как inDriver) ============ */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto space-y-3 pointer-events-auto">
          {/* СТАТУС ОНЛАЙН */}
          <div className="bg-gray-800/90 backdrop-blur rounded-2xl p-4 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <OnlineIcon isOnline={isOnline} />
                  {isOnline && <div className="absolute -inset-1 bg-emerald-400/20 rounded-full animate-ping" />}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isOnline ? 'text-white' : 'text-gray-400'}`}>
                    {isOnline ? 'На линии' : 'Офлайн'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isOnline ? 'Принимаю заказы' : 'Не принимаю заказы'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleOnlineMode}
                disabled={switching}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${
                  isOnline ? 'bg-emerald-500' : 'bg-gray-600'
                } ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            
            {isOnline && (
              <div className="mt-3 pt-3 border-t border-gray-700/50">
                <p className="text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Ожидание заказов...
                </p>
              </div>
            )}
          </div>

          {/* ИНФОРМАЦИЯ О ЗАКАЗЕ (если есть) */}
          {currentOrder && (
            <div className="bg-gray-800/90 backdrop-blur rounded-2xl p-4 border border-gray-700/50 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Текущий заказ</p>
                  <p className="text-white font-semibold text-sm">#{currentOrder.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold text-sm">{currentOrder.amount_paid} ₸</p>
                  <p className="text-xs text-gray-500">{currentOrder.status}</p>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <div className="flex-1 bg-emerald-500/20 rounded-xl p-2 text-center">
                  <p className="text-emerald-400 text-xs font-medium">
                    {currentOrder.supplier?.business_name || 'Ресторан'}
                  </p>
                </div>
                <div className="flex-1 bg-blue-500/20 rounded-xl p-2 text-center">
                  <p className="text-blue-400 text-xs font-medium">
                    {currentOrder.customer_address || 'Клиент'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}