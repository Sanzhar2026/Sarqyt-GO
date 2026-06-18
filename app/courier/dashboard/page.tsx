// app/courier/dashboard/page.tsx - ИДЕАЛЬНАЯ ТЕМА (адаптировано под ваш код)
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import DeliveryMap from '../../components/DeliveryMap';
const CourierMap = dynamic(() => import('../../components/CourierMap'), { ssr: false });

// ============ ИКОНКИ ============
const CarIcon = ({ size = 24, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400/80">
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M5 17a2 2 0 1 0 4 0M19 17a2 2 0 1 0-4 0" />
      <path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
    </svg>
  </div>
);

const LocationIcon = ({ size = 24, className = "" }) => (
  <div className={`inline-flex items-center justify-center ${className}`}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400/80">
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
  const [proposedOrder, setProposedOrder] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [showOrdersList, setShowOrdersList] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [switching, setSwitching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [wsReconnectAttempts, setWsReconnectAttempts] = useState(0);
  const [wsFailed, setWsFailed] = useState(false);
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const orderCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const MAX_WS_RECONNECT_ATTEMPTS = 3;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dlat = (lat2 - lat1) * Math.PI / 180;
    const dlon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dlon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const updateProgress = (currentLat: number, currentLon: number) => {
    if (!currentOrder || !currentOrder.customer_lat || !currentOrder.customer_lon) return;
    
    const distanceToCustomer = calculateDistance(
      currentLat, currentLon,
      currentOrder.customer_lat, currentOrder.customer_lon
    );
    
    if (currentOrder.supplier?.lat && currentOrder.supplier?.lon) {
      const totalDistance = calculateDistance(
        currentOrder.supplier.lat, currentOrder.supplier.lon,
        currentOrder.customer_lat, currentOrder.customer_lon
      );
      
      if (totalDistance > 0) {
        let progress = Math.floor((1 - distanceToCustomer / totalDistance) * 100);
        progress = Math.max(0, Math.min(100, progress));
        setCurrentProgress(progress);
        
        if (progress >= 50 && isOnline) {
          fetchAvailableOrders();
        }
      }
    }
  };

  // useEffect для проверки статуса заказа
  useEffect(() => {
    if (!currentOrder) return;
    
    const checkOrderStatus = async () => {
      try {
        const token = sessionStorage.getItem('courierToken');
        const response = await fetch(`/api/orders/${currentOrder.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const order = await response.json();
        
        if (order.status === 'cancelled') {
          showNotification(
            `❌ Заказ #${order.order_number} отменен! ${order.refund_reason || 'Заказ был отменен'}`,
            'error'
          );
          setCurrentOrder(null);
          setOrderStatus(null);
          setCurrentProgress(0);
          await fetchStatus();
          await fetchAvailableOrders();
          
          if (orderCheckIntervalRef.current) {
            clearInterval(orderCheckIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('Error checking order status:', error);
      }
    };
    
    orderCheckIntervalRef.current = setInterval(checkOrderStatus, 30000);
    
    return () => {
      if (orderCheckIntervalRef.current) clearInterval(orderCheckIntervalRef.current);
    };
  }, [currentOrder]);

  // useEffect для проверки авторизации
  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('courierToken');
      const courierData = sessionStorage.getItem('courier');
      
      console.log('🔍 Проверка авторизации курьера:', { hasToken: !!token, hasData: !!courierData });
      
      if (!token || !courierData) {
        console.log('❌ Нет данных, редирект на логин');
        router.push('/courier/login');
        return;
      }
      
      try {
        const response = await fetch(`/api/courier/status`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📡 Статус ответа:', response.status);
        
        if (response.status === 401) {
          sessionStorage.removeItem('courierToken');
          sessionStorage.removeItem('courier');
          sessionStorage.removeItem('isCourierLoggedIn');
          router.push('/courier/login');
          return;
        }
        
        if (response.status === 403) {
          setPendingVerification(true);
          setLoading(false);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Данные курьера:', data);
          
          if (data.success) {
            if (!data.is_verified) {
              setPendingVerification(true);
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
          } else {
            router.push('/courier/login');
          }
        } else {
          router.push('/courier/login');
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
      if (orderCheckIntervalRef.current) clearInterval(orderCheckIntervalRef.current);
      if (wsReconnectTimeoutRef.current) clearTimeout(wsReconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [router]);

  // Heartbeat
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
        console.log('💓 Heartbeat sent');
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
          console.log(`📍 Текущее положение: ${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // WebSocket
  const connectWebSocket = () => {
    const token = sessionStorage.getItem('courierToken');
    
    if (!token || wsFailed || wsReconnectAttempts >= MAX_WS_RECONNECT_ATTEMPTS) {
      console.log('❌ WebSocket connection failed permanently');
      return;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    
    const encodedToken = encodeURIComponent(token);
    const wsUrl = `wss://toogood-2ncf.onrender.com/ws/courier-tracking?token=${encodedToken}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let lastPongTime = Date.now();
    
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.log('⚠️ WebSocket connection timeout');
        ws.close();
      }
    }, 10000);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      clearTimeout(connectionTimeout);
      setWsReconnectAttempts(0);
      setWsFailed(false);
      lastPongTime = Date.now();
      
      ws.send(JSON.stringify({ type: "ping" }));
      
      heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          if (Date.now() - lastPongTime > 45000) {
            console.log('⚠️ No pong received, reconnecting...');
            ws.close();
            return;
          }
          ws.send(JSON.stringify({ type: "ping" }));
          console.log('💓 Heartbeat sent');
        }
      }, 25000);
      
      if (userLocation) {
        ws.send(JSON.stringify({
          type: "update_location",
          lat: userLocation.lat,
          lon: userLocation.lon
        }));
      }
    };
    
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pong') {
          lastPongTime = Date.now();
          console.log('💓 Heartbeat received');
          return;
        }
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }
        
        console.log('📨 WebSocket message:', data.type);
        
        switch(data.type) {
          case 'connected':
            console.log('✅ WebSocket confirmed for courier:', data.courier_id);
            break;
          case 'new_order_for_courier':
            showNotification(`🆕 Новый заказ! ${data.data.bag_name} на ${data.data.amount} ₸`, 'info');
            setAvailableOrders(prev => [{
              order_id: data.data.order_id,
              order_number: data.data.order_number,
              supplier_name: data.data.supplier_name,
              distance_km: data.data.distance_km || 0,
              estimated_time_minutes: data.data.estimated_time_minutes || 0,
              amount: data.data.amount,
              bag_name: data.data.bag_name,
              customer_address: data.data.customer_address,
              supplier_lat: data.data.supplier_lat,
              supplier_lon: data.data.supplier_lon,
              customer_lat: data.data.customer_lat,
              customer_lon: data.data.customer_lon
            }, ...prev]);
            break;
          case 'order_assigned':
            showNotification('✅ Заказ назначен вам!', 'success');
            await fetchStatus();
            if (data.order_id) await fetchCurrentOrder(data.order_id);
            break;
          case 'delivery_confirmed':
            showNotification('✅ Клиент подтвердил получение заказа!', 'success');
            await fetchStatus();
            if (currentOrder) await fetchCurrentOrder(currentOrder.id);
            break;
          case 'order_cancelled':
            showNotification(`❌ Заказ #${data.data.order_number} отменен!`, 'error');
            setCurrentOrder(null);
            setOrderStatus(null);
            setCurrentProgress(0);
            await fetchStatus();
            await fetchAvailableOrders();
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket closed - Code: ${event.code}`);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      
      if (event.code === 1008) {
        console.log('Auth error, not reconnecting');
        return;
      }
      
      if (isOnline && !wsFailed && wsReconnectAttempts < MAX_WS_RECONNECT_ATTEMPTS) {
        const newAttempts = wsReconnectAttempts + 1;
        setWsReconnectAttempts(newAttempts);
        const delay = Math.min(30000, 5000 * newAttempts);
        console.log(`Reconnecting in ${delay}ms (attempt ${newAttempts}/${MAX_WS_RECONNECT_ATTEMPTS})`);
        wsReconnectTimeoutRef.current = setTimeout(() => {
          if (isOnline) connectWebSocket();
        }, delay);
      } else if (wsReconnectAttempts >= MAX_WS_RECONNECT_ATTEMPTS) {
        setWsFailed(true);
        showNotification('Не удалось подключиться к серверу. Обновите страницу.', 'error');
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
            } catch (error) {
              console.error('Error updating location:', error);
            }
            
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
    }, 5000);
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
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchCurrentOrder = async (orderId: number) => {
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('📦 Заказ получен:', data);
      setCurrentOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
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

  const takeOrder = async (orderId: number) => {
    const token = sessionStorage.getItem('courierToken');
    
    if (!token) {
      alert('Ошибка авторизации');
      router.push('/courier/login');
      return;
    }
    
    try {
      const response = await fetch(`/api/courier/take-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        showNotification('✅ Заказ взят в работу!', 'success');
        await fetchStatus();
        await fetchCurrentOrder(orderId);
        setShowOrdersList(false);
        await fetchAvailableOrders();
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
    
    setPickupLoading(true);
    const token = sessionStorage.getItem('courierToken');
    
    try {
      const res = await fetch(`/api/courier/pickup-order/${currentOrder.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        showNotification('✅ Заказ забран из ресторана! Едем к клиенту.', 'success');
        await fetchStatus();
        await fetchCurrentOrder(currentOrder.id);
      } else {
        alert(data.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при отметке получения заказа');
    } finally {
      setPickupLoading(false);
    }
  };

  const courierArrived = async () => {
    if (!currentOrder) return;
    
    setArriving(true);
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/courier/arrived/${currentOrder.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Уведомление отправлено клиенту!`, 'success');
        fetchStatus();
        fetchCurrentOrder(currentOrder.id);
      } else {
        alert(data.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при отправке уведомления');
    } finally {
      setArriving(false);
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
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                lat: position.coords.latitude,
                lon: position.coords.longitude
              })
            });
            
            const data = await res.json();
            if (data.success) {
              setIsOnline(true);
              setWsReconnectAttempts(0);
              setWsFailed(false);
              startLocationTracking();
              connectWebSocket();
              await fetchAvailableOrders();
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
          
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }
          
          if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
          }
        } else {
          alert(data.message || 'Ошибка');
        }
      } catch (error) {
        alert('Ошибка при уходе с линии');
      } finally {
        setSwitching(false);
      }
    }
  };

  const acceptProposal = async () => {
    if (!proposedOrder) return;
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/courier/respond-to-proposal`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: 'accept' })
      });
      const data = await res.json();
      if (data.success) {
        setShowProposalModal(false);
        setProposedOrder(null);
        fetchStatus();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error accepting proposal:', error);
    }
  };

  const declineProposal = async () => {
    if (!proposedOrder) return;
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`/api/courier/respond-to-proposal`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response: 'decline' })
      });
      const data = await res.json();
      setShowProposalModal(false);
      setProposedOrder(null);
    } catch (error) {
      console.error('Error declining proposal:', error);
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
        setCurrentOrder(null);
        setOrderStatus(null);
        fetchStatus();
        fetchAvailableOrders();
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
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

  // ============ ЗАГРУЗКА ============
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef2f6] p-6">
        <div className="bg-white/90 backdrop-blur rounded-3xl p-8 text-center max-w-md border border-gray-200/60 shadow-lg">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Заявка на рассмотрении</h1>
          <p className="text-gray-500 mb-6">
            Ваша заявка на регистрацию курьера еще не подтверждена администратором.
          </p>
          <Link href="/profile">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition">
              Вернуться в профиль
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ============ ОСНОВНОЙ JSX - ИДЕАЛЬНАЯ ТЕМА ============
  return (
    <div className="min-h-screen bg-[#eef2f6] pb-32">
      {/* HEADER */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-200/60 px-6 pt-12 pb-4">
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
          <button onClick={() => router.push('/profile')} className="bg-gray-100/80 hover:bg-gray-200/80 rounded-full p-2.5 transition backdrop-blur">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* КАРТА */}
      <div className="relative h-72 mx-4 mt-4 rounded-2xl overflow-hidden shadow-lg border border-gray-200/60">
        <CourierMap
          orderId={currentOrder?.id}
          restaurantLocation={currentOrder?.supplier ? { lat: currentOrder.supplier.lat, lon: currentOrder.supplier.lon } : undefined}
          customerLocation={currentOrder?.customer_lat ? { lat: currentOrder.customer_lat, lon: currentOrder.customer_lon } : undefined}
          height="100%"
        />
        
        <button
          onClick={centerToMyLocation}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1000] bg-white/90 backdrop-blur rounded-full shadow-lg p-3 hover:bg-gray-100/90 transition-all active:scale-95 disabled:opacity-50 border border-gray-200/60"
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
        <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-gray-200/60">
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
            <div className="mt-4 pt-4 border-t border-gray-200/60">
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
            <div className="mt-4 pt-4 border-t border-gray-200/60">
              <p className="text-sm text-gray-400 text-center">💤 Нажмите на ползунок чтобы выйти на линию</p>
            </div>
          )}
        </div>
      </div>

      {/* МАРШРУТ ДО РЕСТОРАНА */}
      {currentOrder && currentOrder.status === 'ready_for_pickup' && currentOrder.supplier?.lat && currentOrder.supplier?.lon && userLocation && (
        <div className="px-4 mt-4">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-gray-200/60">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
              <LocationIcon size={20} />
              Маршрут до ресторана
            </h2>
            <div className="h-48 rounded-xl overflow-hidden border border-gray-200/60">
              <DeliveryMapWithRoute
                orderId={currentOrder.id}
                startLat={userLocation.lat}
                startLon={userLocation.lon}
                endLat={currentOrder.supplier.lat}
                endLon={currentOrder.supplier.lon}
                supplierName={currentOrder.supplier.business_name || 'Ресторан'}
                customerAddress="Ресторан"
                courierLocation={userLocation}
                onProgressUpdate={(progress) => console.log(`🚚 Прогресс до ресторана: ${progress}%`)}
              />
            </div>
          </div>
        </div>
      )}

      {/* МАРШРУТ ДО КЛИЕНТА */}
      {currentOrder && currentOrder.status === 'picked_up' && currentOrder.customer_lat && currentOrder.customer_lon && userLocation && (
        <div className="px-4 mt-4">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-gray-200/60">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
              <CarIcon size={20} />
              Маршрут до клиента
            </h2>
            <div className="h-48 rounded-xl overflow-hidden border border-gray-200/60">
              <DeliveryMapWithRoute
                orderId={currentOrder.id}
                startLat={userLocation.lat}
                startLon={userLocation.lon}
                endLat={currentOrder.customer_lat}
                endLon={currentOrder.customer_lon}
                supplierName={currentOrder.supplier?.business_name || 'Ресторан'}
                customerAddress={currentOrder.customer_address || 'Адрес клиента'}
                courierLocation={userLocation}
                onProgressUpdate={(progress) => console.log(`🚚 Прогресс доставки: ${progress}%`)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ТЕКУЩИЙ ЗАКАЗ */}
      {currentOrder && currentOrder.status !== 'delivered' && currentOrder.status !== 'cancelled' && (
        <div className="px-4 mt-4 pb-32">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-gray-200/60">
            <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
              📦 Текущий заказ #{currentOrder.order_number}
            </h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                <span className="text-gray-500">Ресторан:</span>
                <span className="font-medium text-gray-800 text-right">{currentOrder.supplier?.business_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                <span className="text-gray-500">Клиент:</span>
                <span className="font-medium text-gray-800 text-right">{currentOrder.customer_address || 'Адрес не указан'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Сумма:</span>
                <span className="font-bold text-emerald-500 text-lg">{currentOrder.amount_paid} ₸</span>
              </div>
            </div>
            
            {currentOrder.status === 'ready_for_pickup' && (
              <button
                onClick={pickupOrder}
                disabled={pickupLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {pickupLoading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Загрузка...</>
                ) : (
                  <>
                    <span>📦 Забрал заказ из ресторана</span>
                  </>
                )}
              </button>
            )}
            
            {currentOrder.status === 'picked_up' && (
              <button
                onClick={courierArrived}
                disabled={arriving}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-semibold transition disabled:opacity-50"
              >
                {arriving ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Отправка...</>
                ) : (
                  <>
                    <span>🚗 Я приехал</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ДОСТУПНЫЕ ЗАКАЗЫ */}
      {isOnline && !currentOrder && (
        <div className="px-4 mt-4">
          <button 
            onClick={() => { fetchAvailableOrders(); setShowOrdersList(!showOrdersList); }} 
            className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition border border-blue-500/20"
          >
            Список доступных заказов ({availableOrders.length})
          </button>
          
          {showOrdersList && availableOrders.length > 0 && (
            <div className="mt-3 space-y-3">
              {availableOrders.map((order) => (
                <div key={order.order_id} className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200/60">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{order.supplier_name}</p>
                      <p className="text-xs text-gray-500">{order.amount} ₸</p>
                    </div>
                    <span className="font-bold text-emerald-500">{order.amount} ₸</span>
                  </div>
                  <button onClick={() => takeOrder(order.order_id)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                    Взять заказ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО */}
      {showProposalModal && proposedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur rounded-3xl max-w-sm w-full p-6 border border-gray-200/60 shadow-2xl">
            <div className="text-center mb-4">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🚚</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Новый заказ!</h2>
              <p className="text-gray-500 text-sm mt-1">Расстояние до ресторана: {proposedOrder.distance_km} км</p>
              <p className="text-xs text-gray-400 mt-2">Предложение действует {proposedOrder.expires_in} секунд</p>
            </div>
            <div className="flex gap-3">
              <button onClick={acceptProposal} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition">Принять</button>
              <button onClick={declineProposal} className="flex-1 bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 py-3 rounded-xl font-semibold transition">Отклонить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}