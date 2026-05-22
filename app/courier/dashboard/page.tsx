'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  order_number: string;
  customer_address: string;
  customer_lat: number;
  customer_lon: number;
  status: string;
  amount: number;
}

export default function CourierDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lon: number} | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Проверка авторизации курьера
  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/courier/check-auth', {
        credentials: 'include'
      });
      if (!res.ok) {
        router.push('/courier/login');
      }
    };
    checkAuth();
  }, []);

  // Загрузка назначенных заказов
  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch('/api/courier/orders', {
        credentials: 'include'
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  // Отправка GPS (каждые 10 секунд)
  useEffect(() => {
    if (!selectedOrder) return;

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          await fetch('/api/courier/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: selectedOrder.id,
              lat: lat,
              lon: lon
            })
          });
        });
      }
    }, 10000); // каждые 10 секунд

    return () => clearInterval(interval);
  }, [selectedOrder]);

  const updateOrderStatus = async (orderId: number, status: string) => {
    await fetch(`/api/courier/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    // Обновляем локальный список
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8">
        <h1 className="text-2xl font-bold">🚚 Панель курьера</h1>
        <p className="text-emerald-100 text-sm mt-1">Ваши назначенные заказы</p>
      </div>

      <div className="px-6 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500">Нет назначенных заказов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${
                  selectedOrder?.id === order.id 
                    ? 'border-emerald-500' 
                    : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">Заказ #{order.order_number}</h3>
                    <p className="text-gray-500 text-sm mt-1">📍 {order.customer_address}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.status === 'assigned' ? 'Назначен' :
                     order.status === 'picked_up' ? 'Забран' : 'В пути'}
                  </span>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold"
                  >
                    📍 Отслеживать
                  </button>
                  {order.status === 'assigned' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'picked_up')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold"
                    >
                      ✅ Забрал
                    </button>
                  )}
                  {order.status === 'picked_up' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold"
                    >
                      🎉 Доставил
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}