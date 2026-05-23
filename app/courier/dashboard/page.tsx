// app/courier/dashboard/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const CourierMap = dynamic(() => import('../../components/CourierMap'), { ssr: false });

export default function CourierDashboard() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [proposedOrder, setProposedOrder] = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [distanceToCustomer, setDistanceToCustomer] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [showOrdersList, setShowOrdersList] = useState(false);
  
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Загрузка статуса при монтировании
  useEffect(() => {
    checkAuth();
    fetchStatus();
    
    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Проверка авторизации
  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/check-auth`, { credentials: 'include' });
      const data = await res.json();
      if (!data.authenticated) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  // Получение статуса курьера
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/courier/status`, { credentials: 'include' });
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

  // Получение текущего заказа
  const fetchCurrentOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, { credentials: 'include' });
      const data = await res.json();
      setCurrentOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  // Получение доступных заказов
  const fetchAvailableOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/courier/available-orders`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAvailableOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  // Подключение WebSocket для получения предложений
  const connectWebSocket = () => {
    const ws = new WebSocket(`${API_URL.replace('https', 'wss')}/ws/courier-tracking`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'proposed_order') {
        setProposedOrder({
          order_id: data.order_id,
          distance_km: data.distance_km,
          expires_in: data.expires_in_seconds
        });
        setShowProposalModal(true);
      } else if (data.type === 'order_assigned') {
        fetchStatus();
        fetchCurrentOrder(data.order_id);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(connectWebSocket, 3000);
    };
  };

  // Отслеживание геолокации
  const startLocationTracking = () => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    
    locationIntervalRef.current = setInterval(() => {
      if (navigator.geolocation && isOnline) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            setLocation({ lat, lon });
            
            try {
              const response = await fetch(`${API_URL}/api/courier/update-location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ lat, lon })
              });
              
              const data = await response.json();
              if (data.status !== orderStatus) {
                setOrderStatus(data.status);
              }
            } catch (error) {
              console.error('Error updating location:', error);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
          }
        );
      }
    }, 3000);
  };

  // Выход на линию
  const goOnline = async () => {
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`${API_URL}/api/courier/go-online`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
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
            setLoading(false);
          }
        },
        () => {
          alert('Разрешите доступ к геолокации');
          setLoading(false);
        }
      );
    } else {
      alert('Геолокация не поддерживается');
      setLoading(false);
    }
  };

  // Уход с линии
  const goOffline = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/courier/go-offline`, {
        method: 'POST',
        credentials: 'include'
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
      setLoading(false);
    }
  };

  // Принять предложенный заказ
  const acceptProposal = async () => {
    if (!proposedOrder) return;
    
    try {
      const res = await fetch(`${API_URL}/api/courier/respond-to-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  // Отклонить предложенный заказ
  const declineProposal = async () => {
    if (!proposedOrder) return;
    
    try {
      const res = await fetch(`${API_URL}/api/courier/respond-to-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response: 'decline' })
      });
      
      const data = await res.json();
      setShowProposalModal(false);
      setProposedOrder(null);
    } catch (error) {
      console.error('Error declining proposal:', error);
    }
  };

  // Завершить доставку
  const completeDelivery = async () => {
    if (!currentOrder) return;
    
    try {
      const res = await fetch(`${API_URL}/api/courier/complete-order/${currentOrder.id}`, {
        method: 'POST',
        credentials: 'include'
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

  // Выбрать заказ из списка
  const selectOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/courier/accept-order/${orderId}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await res.json();
      if (data.success) {
        setShowOrdersList(false);
        fetchStatus();
        fetchCurrentOrder(orderId);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error selecting order:', error);
    }
  };

  // Получить статус на русском
  const getStatusText = (status: string) => {
    switch (status) {
      case 'almost_done': return '🔔 Почти закончил';
      case 'delivering': return '🚚 Доставка';
      case 'assigned': return '📦 Заказ назначен';
      case 'nearby': return '📍 Рядом с клиентом';
      default: return '✅ На линии';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🚚 Панель курьера</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {isOnline ? 'Вы на линии' : 'Вы офлайн'}
            </p>
          </div>
          <Link href="/profile" className="bg-white/20 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Карта */}
      <div className="h-64 m-4 rounded-2xl overflow-hidden shadow-lg">
        <CourierMap
          orderId={currentOrder?.id}
          restaurantLocation={currentOrder?.supplier ? { lat: currentOrder.supplier.lat, lon: currentOrder.supplier.lon } : undefined}
          customerLocation={currentOrder?.customer_lat ? { lat: currentOrder.customer_lat, lon: currentOrder.customer_lon } : undefined}
        />
      </div>

      {/* Статус бар */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <div>
                <p className="font-semibold">
                  {status?.first_name} {status?.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {status?.courier_type === 'driver' ? '🚗 На машине' : '🚶 Пеший'} • 
                  Рейтинг: {status?.rating} ⭐ • 
                  Доставок: {status?.total_deliveries}
                </p>
              </div>
            </div>
            {orderStatus && (
              <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {getStatusText(orderStatus)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="px-4 mb-6">
        {!isOnline ? (
          <button
            onClick={goOnline}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>🟢</span> Выйти на линию
              </>
            )}
          </button>
        ) : (
          <button
            onClick={goOffline}
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>⚫</span> Уйти с линии
              </>
            )}
          </button>
        )}
      </div>

      {/* Текущий заказ */}
      {currentOrder && (
        <div className="px-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-lg mb-4">📦 Текущий заказ #{currentOrder.order_number}</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Ресторан:</span>
                <span className="font-medium">{currentOrder.supplier?.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Клиент:</span>
                <span className="font-medium">{currentOrder.customer_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Сумма:</span>
                <span className="font-bold text-emerald-600">{currentOrder.amount_paid} ₸</span>
              </div>
              {currentOrder.delivery_deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Доставить до:</span>
                  <span className="font-medium text-orange-600">
                    {new Date(currentOrder.delivery_deadline).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            
            {orderStatus === 'almost_done' && (
              <button
                onClick={completeDelivery}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold"
              >
                ✅ Завершить доставку
              </button>
            )}
          </div>
        </div>
      )}

      {/* Доступные заказы */}
      {isOnline && !currentOrder && (
        <div className="px-4 mb-6">
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
                      <p className="text-xs text-gray-500">{order.distance_km} км • ~{order.estimated_time_minutes} мин</p>
                    </div>
                    <span className="font-bold text-emerald-600">{order.amount} ₸</span>
                  </div>
                  <button
                    onClick={() => selectOrder(order.order_id)}
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
              <p className="text-gray-500">Нет доступных заказов поблизости</p>
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

      {/* Инструкция */}
      {isOnline && !currentOrder && (
        <div className="px-4 pb-20">
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-sm text-blue-700">
              💡 Вы на линии! Система автоматически предложит заказ, когда вы будете рядом с рестораном.
              Также вы можете выбрать заказ из списка выше.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}