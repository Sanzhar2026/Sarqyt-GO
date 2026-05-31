// app/courier/dashboard/page.tsx - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const CourierMap = dynamic(() => import('../../components/CourierMap'), { ssr: false });
const DeliveryMapWithRoute = dynamic(() => import('../../components/DeliveryMapWithRoute'), { ssr: false });

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
  
  const [currentProgress, setCurrentProgress] = useState(0);
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const orderCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const API_URL = 'https://toogood-2ncf.onrender.com';

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
// Добавьте этот useEffect для мониторинга состояния соединения

useEffect(() => {
    if (!isOnline) return;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const monitorConnection = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
            reconnectAttempts++;
            console.log(`⚠️ WebSocket not open, attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
            
            if (reconnectAttempts <= maxReconnectAttempts) {
                connectWebSocket();
            } else {
                console.log('❌ Max reconnection attempts reached');
                showNotification('Не удалось подключиться к серверу. Обновите страницу.', 'error');
                clearInterval(monitorConnection);
            }
        } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            reconnectAttempts = 0; // Сброс при успешном соединении
        }
    }, 15000); // Проверяем каждые 15 секунд
    
    return () => clearInterval(monitorConnection);
}, [isOnline]);
  // ✅ ПЕРИОДИЧЕСКАЯ ПРОВЕРКА СТАТУСА ЗАКАЗА (КАЖДЫЕ 30 СЕКУНД)
  useEffect(() => {
    if (!currentOrder) return;
    
    const checkOrderStatus = async () => {
      try {
        const token = sessionStorage.getItem('courierToken');
        const response = await fetch(`${API_URL}/api/orders/${currentOrder.id}`, {
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
        const response = await fetch(`${API_URL}/api/courier/status`, {
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
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ✅ HEARTBEAT ДЛЯ WEBSOCKET (КАЖДЫЕ 25 СЕКУНД)
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
        console.log('💓 Heartbeat sent');
      }
    }, 25000);
    
    return () => clearInterval(heartbeat);
  }, []);

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

  const fetchStatus = async () => {
    const token = sessionStorage.getItem('courierToken');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/courier/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setIsOnline(data.is_online);
        setStatus(data);
        setOrderStatus(data.current_order_status);
        
        if (data.is_online && !locationIntervalRef.current) {
          startLocationTracking();
          connectWebSocket();
        }
        
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
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const res = await fetch(`${API_URL}/api/courier/available-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    
    console.log(`📦 Попытка взять заказ ${orderId}`);
    
    if (!token) {
      alert('Ошибка авторизации. Пожалуйста, войдите заново.');
      router.push('/courier/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/courier/take-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('📥 Ответ:', data);
      
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

  const courierArrived = async () => {
    if (!currentOrder) return;
    
    setArriving(true);
    const token = sessionStorage.getItem('courierToken');
    try {
      const res = await fetch(`${API_URL}/api/courier/arrived/${currentOrder.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  // app/courier/dashboard/page.tsx - Improved WebSocket

const connectWebSocket = () => {
    const token = sessionStorage.getItem('courierToken');
    
    console.log('🔍 WebSocket connection attempt');
    
    if (!token) {
        console.log('❌ Нет токена для WebSocket');
        return;
    }
    
    // Закрываем существующее соединение если есть
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('Closing existing WebSocket connection');
        wsRef.current.close();
    }
    
    const encodedToken = encodeURIComponent(token);
    const wsUrl = `${API_URL.replace('https', 'wss')}/ws/courier-tracking?token=${encodedToken}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    // Переменные для heartbeat
    let heartbeatInterval = null;
    let connectionTimeout = null;
    
    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        
        // Очищаем таймаут подключения
        if (connectionTimeout) clearTimeout(connectionTimeout);
        
        // Отправляем initial ping
        ws.send(JSON.stringify({ type: "ping" }));
        
        // Настраиваем регулярный heartbeat (каждые 20 секунд)
        heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping" }));
                console.log('💓 Heartbeat sent');
            } else {
                console.log('⚠️ Cannot send heartbeat - WebSocket not open');
                if (heartbeatInterval) clearInterval(heartbeatInterval);
            }
        }, 20000);
        
        if (userLocation) {
            ws.send(JSON.stringify({
                type: "update_location",
                lat: userLocation.lat,
                lon: userLocation.lon
            }));
            console.log('📍 Initial location sent');
        }
        
        showNotification('✅ Подключен к серверу', 'success');
    };
    
    ws.onmessage = async (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message:', data.type);
            
            if (data.type === 'connected') {
                console.log('✅ WebSocket подтвержден для курьера:', data.courier_id);
            }
            
            else if (data.type === 'pong') {
                console.log('💓 Heartbeat received');
            }
            
            else if (data.type === 'ping') {
                // Ответ на ping от сервера
                ws.send(JSON.stringify({ type: "pong" }));
                console.log('💓 Pong sent to server');
            }
            
            else if (data.type === 'new_order_for_courier') {
                showNotification(`🆕 Новый заказ! ${data.data.bag_name} на ${data.data.amount} ₸`, 'info');
                
                setAvailableOrders(prev => [{
                    order_id: data.data.order_id,
                    order_number: data.data.order_number,
                    supplier_name: data.data.supplier_name,
                    distance_km: 0,
                    estimated_time_minutes: 0,
                    amount: data.data.amount,
                    bag_name: data.data.bag_name,
                    customer_address: data.data.customer_address,
                    supplier_lat: data.data.supplier_lat,
                    supplier_lon: data.data.supplier_lon,
                    customer_lat: data.data.customer_lat,
                    customer_lon: data.data.customer_lon
                }, ...prev]);
            }
            
            else if (data.type === 'proposed_order') {
                setProposedOrder({
                    order_id: data.order_id,
                    distance_km: data.distance_km,
                    expires_in: data.expires_in_seconds
                });
                setShowProposalModal(true);
            } 
            
            else if (data.type === 'order_assigned') {
                showNotification('✅ Заказ назначен вам!', 'success');
                await fetchStatus();
                await fetchCurrentOrder(data.order_id);
            } 
            
            else if (data.type === 'delivery_confirmed') {
                showNotification('✅ Клиент подтвердил получение заказа!', 'success');
                await fetchStatus();
                await fetchCurrentOrder(data.data.order_id);
            }
            
            else if (data.type === 'order_cancelled') {
                const { order_id, order_number, reason, cancelled_by } = data.data;
                
                console.log(`❌ Заказ #${order_number} отменен`);
                
                showNotification(
                    `❌ Заказ #${order_number} отменен! Причина: ${reason}`,
                    'error'
                );
                
                if (currentOrder?.id === order_id || currentOrder?.order_id === order_id) {
                    setCurrentOrder(null);
                    setOrderStatus(null);
                    setCurrentProgress(0);
                    
                    setTimeout(() => {
                        alert(`❌ Заказ #${order_number} был отменен.\nПричина: ${reason}`);
                    }, 500);
                }
                
                await fetchStatus();
                await fetchAvailableOrders();
            }
            
            else if (data.type === 'order_returned') {
                const { order_number, reason } = data.data;
                showNotification(
                    `🔄 Заказ #${order_number} возвращен в список. ${reason || 'Заказ снова доступен'}`,
                    'info'
                );
                await fetchAvailableOrders();
            }
            
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Не показываем уведомление при каждой ошибке, чтобы не спамить
    };
    
    ws.onclose = (event) => {
        console.log(`WebSocket closed - Code: ${event.code}, Reason: ${event.reason}`);
        
        // Очищаем интервалы
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (connectionTimeout) clearTimeout(connectionTimeout);
        
        // Не переподключаемся при ошибке авторизации
        if (event.code === 1008) {
            console.log('Authorization failed, not reconnecting');
            showNotification('Сессия истекла. Пожалуйста, войдите заново.', 'error');
            return;
        }
        
        // Переподключаемся только если курьер онлайн
        if (isOnline) {
            const reconnectDelay = 5000; // 5 seconds
            console.log(`Reconnecting in ${reconnectDelay/1000} seconds...`);
            setTimeout(() => {
                if (isOnline) {
                    connectWebSocket();
                }
            }, reconnectDelay);
        }
    };
    
    // Таймаут подключения
    connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
            console.log('Connection timeout, closing...');
            ws.close();
        }
    }, 10000);
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
              await fetch(`${API_URL}/api/courier/update-location`, {
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
              console.log('📍 Позиция отправлена через WebSocket:', lat, lon);
            }
          },
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      }
    }, 5000);
  };
  
  const centerToMyLocation = () => {
    console.log('📍 Нажата кнопка геолокации');
    setLocating(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`📍 Текущие координаты: ${latitude}, ${longitude}`);
          
          setUserLocation({ lat: latitude, lon: longitude });
          
          window.dispatchEvent(new CustomEvent('centerMap', { 
            detail: { lat: latitude, lon: longitude, zoom: 16 }
          }));
          
          setLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Не удалось определить местоположение. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Разрешите доступ к геолокации.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Информация о местоположении недоступна.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Время ожидания истекло.';
              break;
          }
          alert(errorMessage);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Геолокация не поддерживается');
      setLocating(false);
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
            const res = await fetch(`${API_URL}/api/courier/go-online`, {
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
        const res = await fetch(`${API_URL}/api/courier/go-offline`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
      const res = await fetch(`${API_URL}/api/courier/respond-to-proposal`, {
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
      const res = await fetch(`${API_URL}/api/courier/respond-to-proposal`, {
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
      const res = await fetch(`${API_URL}/api/courier/complete-order/${currentOrder.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    toast.className = `fixed bottom-24 left-4 right-4 z-50 p-4 rounded-xl text-white text-center ${
      type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } animate-slide-up`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Заявка на рассмотрении</h1>
          <p className="text-gray-500 mb-6">
            Ваша заявка на регистрацию курьера еще не подтверждена администратором.
          </p>
          <Link href="/profile">
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl">
              Вернуться в профиль
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🚚 Панель курьера</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {status?.first_name} {status?.last_name}
            </p>
            {userLocation && (
              <p className="text-emerald-100 text-xs mt-1 opacity-70">
                📍 {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
              </p>
            )}
          </div>
          <Link href="/profile" className="bg-white/20 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Карта с курьерами */}
      <div className="relative h-64 m-4 rounded-2xl overflow-hidden shadow-lg">
        <CourierMap
          orderId={currentOrder?.id}
          restaurantLocation={currentOrder?.supplier ? { lat: currentOrder.supplier.lat, lon: currentOrder.supplier.lon } : undefined}
          customerLocation={currentOrder?.customer_lat ? { lat: currentOrder.customer_lat, lon: currentOrder.customer_lon } : undefined}
        />
        
        <button
          onClick={centerToMyLocation}
          disabled={locating}
          className="absolute bottom-4 right-4 z-[1000] bg-white rounded-full shadow-lg p-3 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
          title="Мое местоположение"
        >
          {locating ? (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
        
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('fitBoundsToCouriers'));
          }}
          className="absolute bottom-4 left-4 z-[1000] bg-white rounded-full shadow-lg p-3 hover:bg-gray-100 transition-all active:scale-95"
          title="Показать всех курьеров"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7 17H3v2h4v-2z" />
          </svg>
        </button>
      </div>

      {/* Ползунок переключения режима */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isOnline ? '🟢' : '⚫'}</span>
              <div>
                <p className="font-semibold text-lg">
                  {isOnline ? 'На линии' : 'Офлайн'}
                </p>
                <p className="text-xs text-gray-500">
                  {isOnline 
                    ? 'Вы готовы принимать заказы' 
                    : 'Включите режим чтобы получать заказы'}
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleOnlineMode}
              disabled={switching}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                isOnline ? 'bg-emerald-600' : 'bg-gray-300'
              } ${switching ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-xs ${
                  isOnline ? 'translate-x-8' : 'translate-x-0'
                }`}
              >
                {isOnline ? '✓' : '○'}
              </span>
            </button>
          </div>
          
          {isOnline && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Статус:</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
                  Принимаю заказы
                </span>
              </div>
              {orderStatus && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Текущий статус:</span>
                  <span className="text-blue-600 font-medium">{getStatusText(orderStatus)}</span>
                </div>
              )}
            </div>
          )}
          
          {!isOnline && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-400 text-center">
                💤 Нажмите на ползунок чтобы выйти на линию
              </p>
            </div>
          )}
        </div>
      </div>

      {/* МАРШРУТ ДОСТАВКИ */}
      {currentOrder && currentOrder.status === 'out_for_delivery' && (
        <div className="px-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-lg mb-4">🗺️ Маршрут доставки</h2>
            <DeliveryMapWithRoute
              orderId={currentOrder.id}
              startLat={userLocation?.lat || currentOrder.supplier?.lat || 0}
              startLon={userLocation?.lon || currentOrder.supplier?.lon || 0}
              endLat={currentOrder.customer_lat || 0}
              endLon={currentOrder.customer_lon || 0}
              supplierName={currentOrder.supplier?.business_name || 'Ресторан'}
              customerAddress={currentOrder.customer_address || 'Адрес клиента'}
              onProgressUpdate={(progress) => {
                console.log(`🚚 Прогресс доставки: ${progress}%`);
              }}
            />
          </div>
        </div>
      )}

      {/* Текущий заказ */}
      {currentOrder && currentOrder.status !== 'delivered' && (
        <div className="px-4 mb-6 pb-40">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-lg mb-4">📦 Текущий заказ #{currentOrder.order_number}</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Ресторан:</span>
                <span className="font-medium text-right">{currentOrder.supplier?.business_name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-gray-500">Клиент:</span>
                <span className="font-medium text-right">{currentOrder.customer_address || 'Адрес не указан'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Сумма:</span>
                <span className="font-bold text-emerald-600 text-lg">{currentOrder.amount_paid} ₸</span>
              </div>
            </div>
            
            <div className="mt-4 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Прогресс доставки</span>
                <span className="font-semibold">{orderStatus === 'almost_done' ? '🔔 Почти закончил' : `${currentProgress}%`}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              {currentProgress >= 50 && availableOrders.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">
                    💡 Вы выполнили {currentProgress}% заказа! Есть новые предложения выше.
                  </p>
                </div>
              )}
            </div>
            
            {currentOrder.status === 'out_for_delivery' && (
              <button
                onClick={courierArrived}
                disabled={arriving}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold mt-2 flex items-center justify-center gap-2 text-lg"
              >
                {arriving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Отправка...
                  </>
                ) : (
                  <>
                    {status?.courier_type === 'driver' ? '🚚 Я приехал' : '🚶 Я пришел'}
                  </>
                )}
              </button>
            )}
            
            {currentOrder.status === 'nearby' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-3 text-center">
                <div className="text-3xl mb-1">⏳</div>
                <p className="font-semibold text-yellow-700">Ожидаем подтверждения от клиента</p>
                <p className="text-xs text-yellow-600 mt-1">Клиент получил уведомление о вашем прибытии</p>
              </div>
            )}
            
            {orderStatus === 'almost_done' && (
              <button
                onClick={completeDelivery}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold mt-4 text-lg shadow-lg"
              >
                ✅ Завершить доставку
              </button>
            )}
          </div>
        </div>
      )}

      {/* Доступные заказы */}
      {isOnline && !currentOrder && (
        <div className="px-4 mb-6 pb-32">
          <button
            onClick={() => {
              fetchAvailableOrders();
              setShowOrdersList(!showOrdersList);
            }}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            📋 Список доступных заказов ({availableOrders.length})
          </button>
          
          {showOrdersList && availableOrders.length > 0 && (
            <div className="mt-3 space-y-3">
              {availableOrders.map((order) => (
                <div key={order.order_id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{order.supplier_name}</p>
                      <p className="text-xs text-gray-500">{order.amount} ₸</p>
                    </div>
                    <span className="font-bold text-emerald-600">{order.amount} ₸</span>
                  </div>
                  <button
                    onClick={() => takeOrder(order.order_id)}
                    className="w-full bg-emerald-600 text-white py-2 rounded-xl text-sm"
                  >
                    Взять заказ
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {showOrdersList && availableOrders.length === 0 && (
            <div className="mt-3 bg-white rounded-xl p-6 text-center">
              <p className="text-gray-500">Нет доступных заказов</p>
            </div>
          )}
        </div>
      )}

      {/* Модальное окно предложения заказа */}
      {showProposalModal && proposedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📦</div>
              <h2 className="text-xl font-bold">Новый заказ!</h2>
              <p className="text-gray-500 text-sm mt-1">
                Расстояние до ресторана: {proposedOrder.distance_km} км
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Предложение действует {proposedOrder.expires_in} секунд
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={acceptProposal}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold"
              >
                Принять
              </button>
              <button
                onClick={declineProposal}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Дополнительный отступ внизу */}
      <div className="h-16" />
    </div>
  );
}