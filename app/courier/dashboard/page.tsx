// app/courier/dashboard/page.tsx - ПОЛНАЯ ВЕРСИЯ

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
  const [pendingVerification, setPendingVerification] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [locating, setLocating] = useState(false);
  
  // ✅ setSelectedOrder ДОБАВЛЕНА
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [orderStage, setOrderStage] = useState<'list' | 'details' | 'to_restaurant' | 'to_customer' | 'arrived' | 'waiting_confirmation' | 'completed'>('list');
  
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
        if (data.type === 'delivery_confirmed_by_customer') {
          showNotification('✅ Клиент подтвердил получение заказа!', 'success');
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
      } else if (data.status === 'waiting_confirmation') {
        setOrderStage('waiting_confirmation');
      } else if (data.status === 'delivered') {
        setOrderStage('completed');
      } else {
        setOrderStage('to_restaurant');
      }
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
        showNotification('📦 Заказ передан клиенту! Ожидайте подтверждения.', 'info');
        setOrderStage('waiting_confirmation');
        await fetchCurrentOrder(currentOrder.id);
      } else {
        alert(data.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('Ошибка при завершении доставки');
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
          setOrderStage('list');
          setSelectedOrder(null);
          setCurrentOrder(null);
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

  const goBackToList = () => {
    setOrderStage('list');
    setSelectedOrder(null);
    fetchAvailableOrders();
  };

  // ============ РЕНДЕР КАРТОЧКИ ЗАКАЗА ДЛЯ СПИСКА ============
  const renderOrderCard = (order: any) => (
    <div 
      key={order.order_id} 
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
      onClick={() => {
        setSelectedOrder(order);
        setOrderStage('details');
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
    </div>
  );

  // ============ ДЕТАЛИ ЗАКАЗА С КАРТОЙ ============
  const renderOrderDetails = (order: any) => (
    <div className="space-y-4">
      <button 
        onClick={goBackToList}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
      >
        ← Назад к списку
      </button>
      
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Заказ #{order.order_number}</p>
            <p className="font-bold text-gray-800 text-lg">{order.supplier_name}</p>
          </div>
          <span className="font-bold text-emerald-500 text-lg">{order.amount} ₸</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-xs text-gray-500">Ресторан</p>
            <p className="text-sm font-medium text-gray-800">{order.supplier_address || 'Адрес не указан'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Клиент</p>
            <p className="text-sm font-medium text-gray-800">{order.customer_address || 'Адрес не указан'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-3 text-sm">
          <span className="text-gray-500">📦 {order.bag_name || 'Сюрприз'}</span>
          <span className="text-gray-500">•</span>
          <span className="text-blue-500">📍 {order.distance_km?.toFixed(1) || 0} км</span>
        </div>
      </div>
      
      <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <CourierMap
          orderId={order.order_id}
          restaurantLocation={order.supplier_lat ? { 
            lat: order.supplier_lat, 
            lon: order.supplier_lon 
          } : undefined}
          customerLocation={order.customer_lat ? { 
            lat: order.customer_lat, 
            lon: order.customer_lon 
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
        
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur rounded-xl p-2 shadow-lg border border-gray-200">
          <p className="text-xs text-gray-500">Маршрут до ресторана</p>
          <p className="font-semibold text-gray-800 text-sm">{order.supplier_name}</p>
        </div>
      </div>
      
      <button 
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-semibold text-lg transition"
        onClick={() => takeOrder(order)}
      >
        Взять заказ
      </button>
    </div>
  );

  // ============ АКТИВНЫЙ ЗАКАЗ ============
  const renderActiveOrder = () => {
    if (!currentOrder) return null;
    
    const stageLabels = {
      'to_restaurant': '🚗 Еду в ресторан',
      'to_customer': '🚗 Еду к клиенту',
      'arrived': '📍 Прибыл к клиенту',
      'waiting_confirmation': '⏳ Ожидание подтверждения',
      'completed': '✅ Доставка завершена'
    };
    
    const stageActions = {
      'to_restaurant': (
        <button
          onClick={pickupOrder}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition"
        >
          📦 Забрал заказ
        </button>
      ),
      'to_customer': (
        <button
          onClick={courierArrived}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition"
        >
          🚗 Я приехал
        </button>
      ),
      'arrived': (
        <button
          onClick={completeDelivery}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition"
        >
          ✅ Доставка отдана
        </button>
      ),
      'waiting_confirmation': (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-6 w-6 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
            <p className="text-yellow-600 font-medium">Ожидаем подтверждения от клиента...</p>
          </div>
          <p className="text-sm text-gray-500">Клиент получил заказ и должен подтвердить получение</p>
        </div>
      ),
      'completed': (
        <div className="text-center py-2">
          <p className="text-green-600 font-semibold">✅ Доставка завершена!</p>
        </div>
      )
    };
    
    const stageStyles = {
      'to_restaurant': 'border-blue-200 bg-blue-50',
      'to_customer': 'border-blue-200 bg-blue-50',
      'arrived': 'border-emerald-200 bg-emerald-50',
      'waiting_confirmation': 'border-yellow-200 bg-yellow-50',
      'completed': 'border-green-200 bg-green-50'
    };
    
    return (
      <div className="space-y-4">
        <div className={`bg-white rounded-xl p-4 shadow-sm border ${stageStyles[orderStage as keyof typeof stageStyles] || 'border-gray-100'}`}>
          <p className="text-sm text-gray-500">Активный заказ</p>
          <p className="font-bold text-gray-800 text-lg">{stageLabels[orderStage as keyof typeof stageLabels] || 'В пути'}</p>
          <p className="text-sm text-gray-500">#{currentOrder.order_number} • {currentOrder.supplier?.business_name}</p>
        </div>
        
        <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
          <CourierMap
            orderId={currentOrder.id}
            restaurantLocation={currentOrder.supplier_lat ? { 
              lat: currentOrder.supplier_lat, 
              lon: currentOrder.supplier_lon 
            } : currentOrder.supplier?.lat ? { 
              lat: currentOrder.supplier.lat, 
              lon: currentOrder.supplier.lon 
            } : undefined}
            customerLocation={currentOrder.customer_lat ? { 
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
          
          <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur rounded-xl p-2 shadow-lg border border-gray-200">
            <p className="text-xs text-gray-500">Маршрут доставки</p>
            <p className="font-semibold text-gray-800 text-sm">
              {orderStage === 'to_restaurant' ? '📍 Ресторан' : 
               orderStage === 'to_customer' ? '📍 Клиент' : 
               orderStage === 'arrived' ? '📍 Вы на месте' : 
               orderStage === 'waiting_confirmation' ? '⏳ Ожидание' : '✅ Доставлено'}
            </p>
          </div>
        </div>
        
        {stageActions[orderStage as keyof typeof stageActions]}
        
        {orderStage !== 'completed' && orderStage !== 'waiting_confirmation' && (
          <button
            onClick={goBackToList}
            className="w-full text-gray-400 hover:text-gray-600 py-2 text-sm transition"
          >
            Отменить заказ
          </button>
        )}
      </div>
    );
  };

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

      {/* ============ КОНТЕНТ ============ */}
      <div className="px-4 mt-4 pb-32">
        {!isOnline ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Включите режим "На линии" чтобы видеть заказы</p>
          </div>
        ) : orderStage === 'waiting_confirmation' && currentOrder ? (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 text-center shadow-lg">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="font-bold text-2xl text-yellow-700 mb-2">Ожидание подтверждения</h3>
            <p className="text-yellow-600 text-base mb-2">Вы передали заказ клиенту.</p>
            <p className="text-yellow-600 text-sm">Клиент должен подтвердить получение в приложении.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="animate-spin h-6 w-6 border-3 border-yellow-500 border-t-transparent rounded-full"></div>
              <p className="text-sm text-yellow-600 font-medium">Ожидаем подтверждения...</p>
            </div>
          </div>
        ) : orderStage === 'completed' ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200 bg-green-50 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-bold text-green-600 text-xl mb-2">Доставка завершена!</h3>
            <p className="text-gray-500 mb-4">Заказ #{currentOrder?.order_number} успешно доставлен</p>
            <button
              onClick={() => {
                setOrderStage('list');
                setCurrentOrder(null);
                setSelectedOrder(null);
                fetchAvailableOrders();
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition"
            >
              📋 К списку заказов
            </button>
          </div>
        ) : orderStage === 'list' ? (
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
        ) : orderStage === 'details' && selectedOrder ? (
          renderOrderDetails(selectedOrder)
        ) : (orderStage === 'to_restaurant' || orderStage === 'to_customer' || orderStage === 'arrived') && currentOrder ? (
          renderActiveOrder()
        ) : null}
      </div>
    </div>
  );
}