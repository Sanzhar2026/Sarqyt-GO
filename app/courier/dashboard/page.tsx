// app/courier/dashboard/page.tsx - ПОЛНАЯ ВЕРСИЯ С КАРТОЙ
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const CourierMap = dynamic(() => import('../../components/CourierMap'), { ssr: false });

// ============ ИКОНКИ ============
const CarIcon = ({ size = 24, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M5 17a2 2 0 1 0 4 0M19 17a2 2 0 1 0-4 0" />
      <path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  </div>
);

const LocationIcon = ({ size = 24, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  </div>
);

const OnlineIcon = ({ isOnline = false }) => (
  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
);

// ============ ОСНОВНОЙ КОМПОНЕНТ ============
export default function CourierDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [showOrdersList, setShowOrdersList] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  // Состояния заказа
  const [orderStage, setOrderStage] = useState<'list' | 'details' | 'to_restaurant' | 'at_restaurant' | 'to_customer' | 'arrived' | 'completed'>('list');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);
  const [wsFailed, setWsFailed] = useState(false);
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_WS_RECONNECT_ATTEMPTS = 3;

  // ============ ПРОВЕРКА АВТОРИЗАЦИИ ============
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
              setPendingVerification(true);
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
            } else {
              fetchAvailableOrders();
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

  // ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============
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
          showNotification('🆕 Новый заказ доступен!', 'info');
          fetchAvailableOrders();
        }
        if (data.type === 'order_assigned') {
          showNotification('✅ Заказ назначен вам!', 'success');
          if (data.order_id) fetchCurrentOrder(data.order_id);
        }
        if (data.type === 'delivery_confirmed') {
          showNotification('✅ Клиент подтвердил получение!', 'success');
          setOrderStage('completed');
          setCurrentOrder(null);
          setSelectedOrder(null);
          fetchAvailableOrders();
        }
        if (data.type === 'order_cancelled') {
          showNotification('❌ Заказ отменен!', 'error');
          setOrderStage('list');
          setCurrentOrder(null);
          setSelectedOrder(null);
          fetchAvailableOrders();
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

  const fetchAvailableOrders = async () => {
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/courier/available-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAvailableOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const fetchCurrentOrder = async (orderId: number) => {
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCurrentOrder(data);
      setSelectedOrder(data);
      
      if (data.status === 'ready_for_pickup') {
        setOrderStage('to_restaurant');
      } else if (data.status === 'picked_up') {
        setOrderStage('to_customer');
      } else if (data.status === 'nearby') {
        setOrderStage('arrived');
      } else if (data.status === 'delivered') {
        setOrderStage('completed');
      } else {
        setOrderStage('to_restaurant');
      }
      
      setShowOrdersList(false);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const takeOrder = async (order: any) => {
    const token = sessionStorage.getItem('courierToken');
    
    try {
      const response = await fetch(`/api/courier/take-order/${order.order_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        showNotification('✅ Заказ взят в работу! Едем в ресторан.', 'success');
        setSelectedOrder(order);
        setOrderStage('to_restaurant');
        setShowOrdersList(false);
        setShowOrderDetails(false);
        await fetchCurrentOrder(order.order_id);
      } else {
        alert(data.message || 'Ошибка при взятии заказа');
      }
    } catch (error) {
      console.error('Error taking order:', error);
      alert('Ошибка при взятии заказа');
    }
  };

  const pickupOrder = async () => {
    if (!currentOrder) return;
    
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/courier/pickup-order/${currentOrder.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        showNotification('📦 Заказ забран! Едем к клиенту.', 'success');
        setOrderStage('to_customer');
        await fetchCurrentOrder(currentOrder.id);
      } else {
        alert(data.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при отметке получения заказа');
    }
  };

  const courierArrived = async () => {
    if (!currentOrder) return;
    
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/courier/arrived/${currentOrder.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Уведомление отправлено клиенту!`, 'success');
        setOrderStage('arrived');
        await fetchCurrentOrder(currentOrder.id);
      } else {
        alert(data.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при отправке уведомления');
    }
  };

  const completeDelivery = async () => {
    if (!currentOrder) return;
    
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/courier/complete-order/${currentOrder.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        showNotification('✅ Доставка завершена!', 'success');
        setOrderStage('completed');
        setCurrentOrder(null);
        setSelectedOrder(null);
        fetchAvailableOrders();
        setShowOrdersList(true);
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
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
              fetchAvailableOrders();
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
          if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
          if (wsRef.current) wsRef.current.close();
        }
      } catch (error) {
        alert('Ошибка при уходе с линии');
      } finally {
        setSwitching(false);
      }
    }
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
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
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

  // ============ РЕНДЕР КАРТОЧКИ ЗАКАЗА ДЛЯ СПИСКА ============
  const renderOrderCard = (order: any) => (
    <div 
      key={order.order_id} 
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
      onClick={() => {
        setSelectedOrderForDetails(order);
        setShowOrderDetails(true);
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-800">{order.supplier_name}</p>
          <p className="text-xs text-gray-500">#{order.order_number}</p>
        </div>
        <span className="font-bold text-emerald-500">{order.amount} ₸</span>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <LocationIcon size={14} />
        <span>{order.customer_address || 'Адрес не указан'}</span>
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">📦 {order.bag_name || 'Сюрприз'}</span>
        <span className="text-blue-500">📍 {order.distance_km?.toFixed(1) || 0} км</span>
      </div>
      
      <button 
        className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold transition"
        onClick={(e) => { 
          e.stopPropagation(); 
          takeOrder(order);
        }}
      >
        Взять заказ
      </button>
    </div>
  );

  // ============ ДЕТАЛИ ЗАКАЗА (МОДАЛЬНОЕ ОКНО) ============
  const renderOrderDetails = (order: any) => (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Детали заказа</h2>
          <button 
            onClick={() => setShowOrderDetails(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Ресторан</p>
            <p className="font-semibold text-gray-800">{order.supplier_name}</p>
            <p className="text-xs text-gray-400 mt-1">
              📍 {order.supplier_address || 'Адрес не указан'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Клиент</p>
            <p className="font-semibold text-gray-800">{order.customer_address || 'Адрес не указан'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">📦 {order.bag_name || 'Сюрприз'}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-400">{order.amount} ₸</span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500">Расстояние</p>
            <p className="font-semibold text-gray-800">{order.distance_km?.toFixed(1) || 0} км</p>
          </div>
          
          <button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition"
            onClick={() => {
              setShowOrderDetails(false);
              takeOrder(order);
            }}
          >
            Взять заказ
          </button>
        </div>
      </div>
    </div>
  );

  // ============ ЗАГРУЗКА ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-500 rounded-full"></div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Заявка на рассмотрении</h1>
          <p className="text-gray-500 mb-6">
            Ваша заявка на регистрацию курьера еще не подтверждена администратором.
          </p>
          <Link href="/profile">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition">
              Вернуться в профиль
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ============ ОСНОВНОЙ РЕНДЕР ============
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* HEADER */}
      <div className="bg-emerald-500 text-white px-6 pt-12 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CarIcon size={28} className="text-white" />
              Панель курьера
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              {status?.first_name} {status?.last_name}
            </p>
          </div>
          <button onClick={goToProfile} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* СТАТУС ОНЛАЙН */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <OnlineIcon isOnline={isOnline} />
              <div>
                <p className={`font-semibold ${isOnline ? 'text-gray-800' : 'text-gray-400'}`}>
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
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'} ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-xs font-bold ${isOnline ? 'translate-x-6' : 'translate-x-0'}`}>
                {isOnline ? '✓' : '✕'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ============ КАРТА (всегда видна с курьером, рестораном, клиентом) ============ */}
      <div className="relative h-64 mx-4 mt-4 rounded-2xl overflow-hidden shadow-lg">
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
          height="100%"
        />
        
        <button
          onClick={centerToMyLocation}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1000] bg-white rounded-full shadow-lg p-3 hover:bg-gray-50 transition-all"
        >
          {locating ? (
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <LocationIcon size={20} />
          )}
        </button>
        
        {selectedOrder && (
          <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg border border-gray-200">
            <p className="text-xs text-gray-500">Активный заказ</p>
            <p className="font-semibold text-gray-800 text-sm">#{selectedOrder.order_number}</p>
            <p className="text-xs text-gray-500">{selectedOrder.supplier?.business_name}</p>
          </div>
        )}
      </div>

      {/* ============ КОНТЕНТ В ЗАВИСИМОСТИ ОТ ЭТАПА ============ */}
      <div className="px-4 mt-4 pb-32">
        {/* ЭТАП 1: СПИСОК ЗАКАЗОВ */}
        {orderStage === 'list' && isOnline && (
          <div>
            <h2 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <span>📋 Доступные заказы</span>
              <span className="text-sm text-gray-400">({availableOrders.length})</span>
            </h2>
            <div className="space-y-3">
              {availableOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Нет доступных заказов</p>
                </div>
              ) : (
                availableOrders.map(renderOrderCard)
              )}
            </div>
          </div>
        )}

        {/* ЭТАП 2: ПУТЬ ДО РЕСТОРАНА + КНОПКА "ЗАБРАЛ ЗАКАЗ" */}
        {orderStage === 'to_restaurant' && currentOrder && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2">🚗 Еду в ресторан</h3>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Ресторан</p>
                <p className="font-medium text-gray-800">{currentOrder.supplier?.business_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Клиент</p>
                <p className="font-medium text-gray-800">{currentOrder.customer_address || 'Адрес не указан'}</p>
              </div>
            </div>
            <button
              onClick={pickupOrder}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition"
            >
              📦 Забрал заказ
            </button>
          </div>
        )}

        {/* ЭТАП 3: ПУТЬ ДО КЛИЕНТА + КНОПКА "Я ПРИЕХАЛ" */}
        {orderStage === 'to_customer' && currentOrder && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2">🚗 Еду к клиенту</h3>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Клиент</p>
                <p className="font-medium text-gray-800">{currentOrder.customer_address || 'Адрес не указан'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Сумма</p>
                <p className="font-bold text-emerald-500">{currentOrder.amount_paid} ₸</p>
              </div>
            </div>
            <button
              onClick={courierArrived}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
            >
              🚗 Я приехал
            </button>
          </div>
        )}

        {/* ЭТАП 4: ПРИБЫЛ К КЛИЕНТУ + КНОПКА "ДОСТАВКА ОТДАНА" */}
        {orderStage === 'arrived' && currentOrder && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-bold text-green-600 mb-2">📍 Вы прибыли к клиенту</h3>
            <p className="text-sm text-gray-500 mb-3">Ожидайте подтверждения получения</p>
            <button
              onClick={completeDelivery}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition"
            >
              ✅ Доставка отдана
            </button>
          </div>
        )}

        {/* ЭТАП 5: ЗАВЕРШЕН */}
        {orderStage === 'completed' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-200 bg-green-50">
            <h3 className="font-bold text-green-600 mb-2">✅ Доставка завершена!</h3>
            <button
              onClick={() => {
                setOrderStage('list');
                setCurrentOrder(null);
                setSelectedOrder(null);
                fetchAvailableOrders();
                setShowOrdersList(true);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition"
            >
              📋 К списку заказов
            </button>
          </div>
        )}

        {/* Офлайн состояние */}
        {!isOnline && (
          <div className="text-center py-8">
            <p className="text-gray-400">Включите режим "На линии" чтобы видеть заказы</p>
          </div>
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ ЗАКАЗА */}
      {showOrderDetails && selectedOrderForDetails && renderOrderDetails(selectedOrderForDetails)}
    </div>
  );
}