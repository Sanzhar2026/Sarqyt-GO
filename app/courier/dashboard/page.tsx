// app/courier/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  order_number: string;
  customer_address: string;
  customer_lat: number;
  customer_lon: number;
  supplier_name: string;
  supplier_address: string;
  supplier_lat: number;
  supplier_lon: number;
  status: string;
  amount: number;
  delivery_deadline?: string;
}

interface CourierInfo {
  id: number;
  full_name: string;
  phone: string;
  car_model: string;
  car_number: string;
  rating: number;
  total_deliveries: number;
}

export default function CourierDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [courier, setCourier] = useState<CourierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lon: number} | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Проверка авторизации курьера и загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        // Проверка авторизации
        const authRes = await fetch(`${API_URL}/api/courier/me`, {
          credentials: 'include'
        });
        
        if (!authRes.ok) {
          router.push('/courier/login');
          return;
        }
        
        const authData = await authRes.json();
        if (authData.authenticated) {
          setCourier(authData.courier);
        } else {
          router.push('/courier/login');
          return;
        }
        
        // Загрузка заказов
        const ordersRes = await fetch(`${API_URL}/api/courier/orders`, {
          credentials: 'include'
        });
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
        
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/courier/login');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [router]);

  // Таймер для активного заказа
  useEffect(() => {
    if (!selectedOrder?.delivery_deadline) return;
    
    const interval = setInterval(() => {
      const deadline = new Date(selectedOrder.delivery_deadline!);
      const now = new Date();
      const diff = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) {
        clearInterval(interval);
        alert('⏰ Время доставки истекло! Заказ будет автоматически возвращен.');
        fetchOrders();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [selectedOrder?.delivery_deadline]);

  const fetchOrders = async () => {
    const res = await fetch(`${API_URL}/api/courier/orders`, {
      credentials: 'include'
    });
    const data = await res.json();
    setOrders(data.orders || []);
  };

  // Отправка GPS (каждые 10 секунд)
  useEffect(() => {
    if (!trackingActive || !selectedOrder) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCurrentLocation({ lat, lon });
          
          await fetch(`${API_URL}/api/courier/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: selectedOrder.id,
              lat: lat,
              lon: lon
            })
          });
        }, (error) => {
          console.error('Geolocation error:', error);
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [trackingActive, selectedOrder]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/courier/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        await fetchOrders();
        
        if (status === 'delivered') {
          setSelectedOrder(null);
          setTrackingActive(false);
          alert('✅ Заказ доставлен! Отличная работа!');
        } else if (status === 'picked_up') {
          alert('✅ Заказ забран. Отправляйтесь к клиенту!');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const startTracking = (order: Order) => {
    setSelectedOrder(order);
    setTrackingActive(true);
  };

  const stopTracking = () => {
    setTrackingActive(false);
    setSelectedOrder(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      assigned: { text: 'Назначен', color: 'bg-yellow-100 text-yellow-800' },
      picked_up: { text: 'Забран', color: 'bg-blue-100 text-blue-800' },
      delivered: { text: 'Доставлен', color: 'bg-green-100 text-green-800' },
      cancelled: { text: 'Отменен', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/courier/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    router.push('/courier/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 pt-12 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">🚚 Панель курьера</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {courier?.full_name} | ⭐ {courier?.rating || 5.0}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white/20 px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition"
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Карточка курьера */}
      <div className="px-6 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">📞 {courier?.phone}</p>
            <p className="text-xs text-gray-500">🚗 {courier?.car_model} {courier?.car_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-600">📦 {courier?.total_deliveries || 0}</p>
            <p className="text-xs text-gray-500">всего доставок</p>
          </div>
        </div>
      </div>

      {/* Активный трекинг */}
      {trackingActive && selectedOrder && (
        <div className="px-6 mt-4">
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-blue-800">📍 Активная доставка</h3>
              <button onClick={stopTracking} className="text-xs text-gray-500">✖</button>
            </div>
            <p className="text-sm font-medium">Заказ #{selectedOrder.order_number}</p>
            <p className="text-xs text-gray-600 mt-1">📍 {selectedOrder.customer_address}</p>
            {selectedOrder.delivery_deadline && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600">⏱️ Осталось времени:</span>
                  <span className={`text-sm font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${(timeLeft / (30 * 60)) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {currentLocation && (
              <p className="text-xs text-gray-500 mt-2">
                📍 GPS: {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Список заказов */}
      <div className="px-6 py-6">
        <h2 className="font-bold text-lg mb-4">📋 Мои заказы</h2>
        
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Нет назначенных заказов</p>
            <p className="text-xs text-gray-400 mt-1">Когда появятся новые заказы, они отобразятся здесь</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getOrderStatusText(order.status);
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${
                    selectedOrder?.id === order.id && trackingActive
                      ? 'border-emerald-500' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">Заказ #{order.order_number}</h3>
                      <p className="text-gray-500 text-sm mt-1">📍 {order.customer_address}</p>
                      <p className="text-gray-400 text-xs mt-1">🏪 {order.supplier_name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 mt-4">
                    {order.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => startTracking(order)}
                          className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                        >
                          📍 Начать доставку
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                        >
                          ✅ Забрал у поставщика
                        </button>
                      </>
                    )}
                    
                    {order.status === 'picked_up' && (
                      <>
                        <button
                          onClick={() => startTracking(order)}
                          className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                        >
                          📍 Отслеживать
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition"
                        >
                          🎉 Доставил клиенту
                        </button>
                      </>
                    )}
                    
                    {order.status === 'delivered' && (
                      <div className="w-full text-center text-green-600 text-sm font-medium py-2">
                        ✅ Заказ доставлен
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}