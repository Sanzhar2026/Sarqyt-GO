// app/orders/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(() => import('../../components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-200 rounded-xl flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full"></div>
    </div>
  )
});

interface Order {
  id: number;
  order_id: number;
  order_number: string;
  status: string;
  delivery_status: string;
  bag_name: string;
  supplier_name: string;
  supplier_address: string;
  customer_address: string;
  amount_paid: number;
  pickup_time: string;
  created_at: string;
  supplier_lat?: number;
  supplier_lon?: number;
  customer_lat?: number;
  customer_lon?: number;
  payment_status?: string;
  refund_status?: string;
  refund_amount?: number;
  refund_reason?: string;
  delivery_deadline?: string;
  delivery_started_at?: string;
  auto_refund_processed?: boolean;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Получаем геолокацию
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lon: longitude, city: 'Актобе' });
          
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`);
            const geoData = await geoRes.json();
            const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Актобе';
            setLocation(prev => prev ? { ...prev, city } : null);
          } catch (e) {
            console.error('Geocoding error:', e);
          }
          setLocationLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  }, []);

  // Загрузка заказа
  useEffect(() => {
    const fetchOrder = async () => {
      const resolvedParams = await params;
      const orderId = resolvedParams?.id;
      
      if (!orderId) return;
      
      try {
        const response = await fetch(`https://toogood-2ncf.onrender.com/api/orders/${orderId}`);
        if (!response.ok) throw new Error('Order not found');
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error(err);
        setError('Заказ не найден');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [params]);

  // Таймер обратного отсчета для доставки
  useEffect(() => {
    if (order?.status === 'out_for_delivery' && order?.delivery_deadline) {
      const interval = setInterval(() => {
        const deadline = new Date(order.delivery_deadline!);
        const now = new Date();
        const diff = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0 && !order.auto_refund_processed) {
          clearInterval(interval);
          alert('⏰ Время получения истекло. Будет оформлен автоматический возврат.');
          fetchOrder();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order?.status, order?.delivery_deadline, order?.auto_refund_processed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchOrder = async () => {
    const resolvedParams = await params;
    const orderId = resolvedParams?.id;
    if (!orderId) return;
    
    try {
      const response = await fetch(`https://toogood-2ncf.onrender.com/api/orders/${orderId}`);
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ КЛИЕНТ ПОДТВЕРЖДАЕТ ПОЛУЧЕНИЕ ЗАКАЗА
  const handleReceive = async () => {
    if (!confirm('Подтверждаете получение заказа? После подтверждения возврат будет невозможен.')) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`https://toogood-2ncf.onrender.com/api/order/${order?.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        alert('✅ Заказ получен! Спасибо за покупку.');
        await fetchOrder();
      } else {
        const error = await response.json();
        alert(`❌ ${error.detail || 'Ошибка'}`);
      }
    } catch (err) {
      alert('❌ Ошибка при подтверждении получения');
    } finally {
      setSubmitting(false);
    }
  };

  // ❌ КЛИЕНТ ЗАПРАШИВАЕТ ВОЗВРАТ
  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      alert('Укажите причину возврата');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`https://toogood-2ncf.onrender.com/api/order/${order?.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: refundReason })
      });
      
      if (response.ok) {
        alert('✅ Запрос на возврат отправлен. Администратор рассмотрит его в ближайшее время.');
        setShowRefundModal(false);
        setRefundReason('');
        await fetchOrder();
      } else {
        const error = await response.json();
        alert(`❌ ${error.detail || 'Ошибка'}`);
      }
    } catch (err) {
      alert('❌ Ошибка при отправке запроса');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-purple-500',
      ready_for_pickup: 'bg-orange-500',
      out_for_delivery: 'bg-indigo-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status: string, lang: string = 'ru') => {
    const statusMap: Record<string, { kz: string; ru: string }> = {
      pending: { kz: 'Күтілуде', ru: 'Ожидается' },
      confirmed: { kz: 'Расталды', ru: 'Подтвержден' },
      preparing: { kz: 'Дайындалуда', ru: 'Готовится' },
      ready_for_pickup: { kz: 'Дайын', ru: 'Готов к выдаче' },
      out_for_delivery: { kz: 'Жеткізілуде', ru: 'Доставляется' },
      delivered: { kz: 'Жеткізілді', ru: 'Доставлен' },
      cancelled: { kz: 'Бас тартылды', ru: 'Отменен' }
    };
    return statusMap[status]?.[lang] || status;
  };

  // Расчет прогресс-бара
  const getProgressWidth = () => {
    if (order?.status === 'delivered') return '100%';
    if (order?.status === 'out_for_delivery') return '90%';
    if (order?.status === 'ready_for_pickup') return '75%';
    if (order?.status === 'preparing') return '60%';
    if (order?.status === 'confirmed') return '40%';
    if (order?.status === 'pending') return '20%';
    return '0%';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Заказ не найден</h1>
          <p className="text-gray-500 mb-6">Проверьте номер заказа или вернитесь на главную</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const defaultLat = location?.lat || 50.283;
  const defaultLon = location?.lon || 57.167;
  
  const supplierLat = order.supplier_lat || defaultLat;
  const supplierLon = order.supplier_lon || defaultLon;
  const customerLat = order.customer_lat || (defaultLat + 0.01);
  const customerLon = order.customer_lon || (defaultLon + 0.01);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6">
        <button onClick={() => router.back()} className="mb-4 text-white hover:opacity-80 transition">
          ← Назад
        </button>
        <h1 className="text-2xl font-bold">Заказ #{order.order_number}</h1>
        <p className="opacity-90 mt-1">от {new Date(order.created_at).toLocaleDateString()}</p>
      </div>

      <div className="px-6 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Статус:</span>
            <span className={`${getStatusColor(order.status)} text-white px-4 py-1 rounded-full text-sm`}>
              {getStatusText(order.status, 'ru')}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>✅ Заказ</span>
              <span>🍳 Готовка</span>
              <span>📍 Готово</span>
              <span>🚚 Доставка</span>
              <span>🏠 Доставлен</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{ width: getProgressWidth() }}
              />
            </div>
          </div>
        </div>

        {/* ============ КНОПКИ ДЛЯ КЛИЕНТА ============ */}
        
        {/* ✅ Зеленый блок: заказ в доставке */}
        {order.status === 'out_for_delivery' && order.payment_status !== 'refunded' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="text-center mb-4">
              <span className="text-5xl">🚚</span>
              <h2 className="font-bold text-xl text-green-700 mt-2">Ваш заказ в пути!</h2>
              <p className="text-green-600 text-sm">Курьер уже выехал к вам</p>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-3xl font-mono font-bold text-green-600">
                ⏱️ {formatTime(timeLeft)}
              </p>
              <p className="text-xs text-gray-500">Осталось времени на получение</p>
            </div>
            
            <button
              onClick={handleReceive}
              disabled={submitting}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg mb-3 hover:bg-green-700 transition disabled:opacity-50"
            >
              ✅ ПОЛУЧИЛ ЗАКАЗ
            </button>
            
            <button
              onClick={() => setShowRefundModal(true)}
              disabled={submitting}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-50"
            >
              ❌ ОТКАЗАТЬСЯ ОТ ЗАКАЗА
            </button>
          </div>
        )}

        {/* ✅ Синий блок: заказ успешно доставлен */}
        {order.status === 'delivered' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <span className="text-5xl">✅</span>
            <h2 className="font-bold text-xl text-blue-700 mt-2">Заказ успешно доставлен!</h2>
            <p className="text-blue-600 text-sm mt-1">Спасибо, что выбрали нас</p>
          </div>
        )}

        {/* 🟡 Желтый блок: запрос на возврат отправлен */}
        {order.refund_status === 'requested' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <span className="text-5xl">⏳</span>
            <h2 className="font-bold text-xl text-yellow-700 mt-2">Запрос на возврат отправлен</h2>
            <p className="text-yellow-600 text-sm mt-1">Администратор рассмотрит ваш запрос</p>
            {order.refund_reason && (
              <p className="text-xs text-gray-500 mt-3">Причина: {order.refund_reason}</p>
            )}
          </div>
        )}

        {/* 🔴 Красный блок: возврат выполнен */}
        {(order.payment_status === 'refunded' || order.refund_status === 'completed') && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <span className="text-5xl">💰</span>
            <h2 className="font-bold text-xl text-red-700 mt-2">Деньги возвращены</h2>
            <p className="text-red-600 text-sm mt-1">
              Сумма {order.refund_amount || order.amount_paid} ₸ возвращена на вашу карту
            </p>
            {order.refund_reason && (
              <p className="text-xs text-gray-500 mt-3">Причина: {order.refund_reason}</p>
            )}
          </div>
        )}

        {/* Map Section */}
        {(order.status === 'out_for_delivery' || order.status === 'delivered') && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">🗺️ Карта доставки</h2>
            <DeliveryMap
              supplierLat={supplierLat}
              supplierLon={supplierLon}
              customerLat={customerLat}
              customerLon={customerLon}
              supplierName={order.supplier_name}
              customerAddress={order.customer_address || 'Адрес доставки'}
              userLat={location?.lat || defaultLat}
              userLon={location?.lon || defaultLon}
              orderStatus={order.status}
            />
          </div>
        )}

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">📋 Детали заказа</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Товар:</span>
              <span className="font-medium">{order.bag_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Продавец:</span>
              <span className="font-medium">{order.supplier_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Сумма:</span>
              <span className="font-bold text-emerald-600">{order.amount_paid} ₸</span>
            </div>
            {order.pickup_time && (
              <div className="flex justify-between">
                <span className="text-gray-600">Время получения:</span>
                <span className="font-medium">{order.pickup_time}</span>
              </div>
            )}
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">📍 Адрес доставки</h2>
          <p className="text-gray-700">{order.customer_address || 'Адрес не указан'}</p>
          
          {order.supplier_address && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium text-gray-600 mb-2">📦 Адрес самовывоза:</h3>
              <p className="text-gray-700">{order.supplier_address}</p>
            </div>
          )}
        </div>

        {/* User Location Info */}
        {location?.city && !locationLoading && (
          <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
            <span>📍 Ваше местоположение: {location.city}</span>
          </div>
        )}
      </div>

      {/* Модальное окно отказа от заказа */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">❌</div>
              <h2 className="text-xl font-bold">Отказ от заказа</h2>
              <p className="text-gray-500 text-sm mt-1">
                Укажите причину отказа. Администратор рассмотрит ваш запрос.
              </p>
            </div>
            
            <textarea
              className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
              placeholder="Например: передумал, нашел дешевле, не подошел размер..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleRequestRefund}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {submitting ? 'Отправка...' : 'Отправить запрос'}
              </button>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Отмена
              </button>
            </div>
            
            <p className="text-xs text-gray-400 text-center mt-4">
              ⏰ После отправки запроса администратор рассмотрит его в течение 24 часов
            </p>
          </div>
        </div>
      )}
    </div>
  );
}