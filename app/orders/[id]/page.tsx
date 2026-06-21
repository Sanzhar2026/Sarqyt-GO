'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const DeliveryMap = dynamic(() => import('../../components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-200 rounded-xl flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-b-2 border-[#367666] rounded-full"></div>
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
  is_owner?: boolean;
  assigned_courier?: {
    first_name: string;
    last_name: string;
    phone: string;
    courier_type: string;
  };
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
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const API_URL = 'https://toogood-production.up.railway.app';

  // ✅ Функция для получения токена
  const getAuthToken = () => {
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('authToken') || 
           sessionStorage.getItem('courierToken') ||
           null;
  };

  // ✅ Проверка роли пользователя (ВАЖНО!)
  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'customer');
        console.log('👤 Роль пользователя из sessionStorage:', user.role || 'customer');
      } catch (e) {
        console.error('Ошибка парсинга user:', e);
        setUserRole('customer');
      }
    } else {
      // Если нет user в sessionStorage, пробуем из токена
      const token = getAuthToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUserRole(payload.role || 'customer');
          console.log('👤 Роль из токена:', payload.role || 'customer');
        } catch (e) {
          setUserRole('customer');
        }
      } else {
        setUserRole('customer');
      }
    }
  }, []);

  // Загрузка заказа
  const fetchOrder = async () => {
    const orderId = params?.id;
    if (!orderId) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      
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

  useEffect(() => {
    fetchOrder();
  }, [params?.id]);

  // WebSocket для получения уведомлений
  useEffect(() => {
    const orderId = params?.id;
    if (!orderId) return;

    const ws = new WebSocket('wss://toogood-production.up.railway.app/ws');
    
    ws.onopen = () => {
      console.log('WebSocket connected for order');
      ws.send(JSON.stringify({ type: 'subscribe', channel: `order_${orderId}` }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Получено уведомление:', data);
      
      if (data.type === 'courier_arrived') {
        showToast(`${data.data.message}! ${data.data.courier_name} ожидает вас.`, 'info');
        fetchOrder();
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    return () => ws.close();
  }, [params?.id]);

  // Таймер обратного отсчета
  useEffect(() => {
    if (order?.status === 'out_for_delivery' && order?.delivery_deadline) {
      const interval = setInterval(() => {
        const deadline = new Date(order.delivery_deadline!);
        const now = new Date();
        const diff = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
        setTimeLeft(diff);
        
        if (diff === 0 && !order.auto_refund_processed) {
          clearInterval(interval);
          alert('Время получения истекло. Будет оформлен автоматический возврат.');
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

  // ✅ КЛИЕНТ ПОДТВЕРЖДАЕТ ПОЛУЧЕНИЕ
  const handleConfirmDelivery = async () => {
    setConfirmLoading(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        alert('Вы не авторизованы. Пожалуйста, войдите.');
        router.push('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/customer/confirm-delivery/${order?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('✅ Спасибо! Заказ получен.', 'success');
        setShowConfirmModal(false);
        fetchOrder();
      } else {
        alert(data.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при подтверждении');
    } finally {
      setConfirmLoading(false);
    }
  };

  // ЗАПРОС ВОЗВРАТА
  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      alert('Укажите причину возврата');
      return;
    }
    
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/order/${order?.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ reason: refundReason })
      });
      
      if (response.ok) {
        alert('Запрос на возврат отправлен. Администратор рассмотрит его в ближайшее время.');
        setShowRefundModal(false);
        setRefundReason('');
        fetchOrder();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.detail || 'Ошибка'}`);
      }
    } catch (err) {
      alert('Ошибка при отправке запроса');
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
      nearby: 'bg-green-500',
      delivered: 'bg-green-600',
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
      nearby: { kz: 'Жақын жерде', ru: 'Курьер рядом' },
      delivered: { kz: 'Жеткізілді', ru: 'Доставлен' },
      cancelled: { kz: 'Бас тартылды', ru: 'Отменен' }
    };
    return statusMap[status]?.[lang] || status;
  };

  const getProgressWidth = () => {
    if (order?.status === 'delivered') return '100%';
    if (order?.status === 'nearby') return '90%';
    if (order?.status === 'out_for_delivery') return '80%';
    if (order?.status === 'ready_for_pickup') return '75%';
    if (order?.status === 'preparing') return '60%';
    if (order?.status === 'confirmed') return '40%';
    if (order?.status === 'pending') return '20%';
    return '0%';
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-4 right-4 z-50 p-4 rounded-xl text-white text-center ${
      type === 'success' ? 'bg-[#367666]' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    } animate-slide-up`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Заказ не найден</h1>
          <p className="text-gray-500 mb-6">Проверьте номер заказа или вернитесь на главную</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  // ✅ Проверяем роль
  const isCustomer = userRole === 'customer';
  const isCourier = userRole === 'courier';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#367666] text-white p-6">
        <button onClick={() => router.back()} className="mb-4 text-white hover:opacity-80 transition">
          ← Назад
        </button>
        <h1 className="text-2xl font-bold">Заказ #{order.order_number}</h1>
        <p className="opacity-90 mt-1">от {new Date(order.created_at).toLocaleDateString()}</p>
        <p className="text-xs opacity-70 mt-1">
          {isCourier ? '🚚 Вы вошли как курьер' : '👤 Вы вошли как клиент'}
        </p>
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
              <span>Заказ</span>
              <span>Готовка</span>
              <span>Готово</span>
              <span>Доставка</span>
              <span>Доставлен</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#367666] transition-all duration-500"
                style={{ width: getProgressWidth() }}
              />
            </div>
          </div>
        </div>

        {/* ✅ КНОПКА ДЛЯ КЛИЕНТА - ПОЯВЛЯЕТСЯ ТОЛЬКО ДЛЯ КЛИЕНТА */}
        {order.status === 'nearby' && isCustomer && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center shadow-sm animate-pulse">
            <div className="text-5xl mb-3">🚪</div>
            <h2 className="font-bold text-xl text-green-700 mb-2">Курьер рядом!</h2>
            {order.assigned_courier && (
              <p className="text-green-600 text-sm mb-2">
                {order.assigned_courier.first_name} {order.assigned_courier.last_name} ожидает вас
              </p>
            )}
            <p className="text-green-600 text-sm mb-4">
              Подтвердите получение заказа, чтобы завершить доставку.
            </p>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full bg-[#367666] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#2a5a4d] transition shadow-md"
            >
              ✅ ПОЛУЧИЛ ЗАКАЗ
            </button>
          </div>
        )}

        {/* ⚠️ ДЛЯ КУРЬЕРА - показывает что клиент должен подтвердить */}
        {order.status === 'nearby' && isCourier && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-center shadow-sm">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-blue-700 font-medium">Ожидайте подтверждения от клиента</p>
            <p className="text-blue-600 text-sm">Клиент получит уведомление и подтвердит получение</p>
          </div>
        )}

        {/* Заказ в пути */}
        {order.status === 'out_for_delivery' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <div className="text-5xl mb-3">🚗</div>
            <h2 className="font-bold text-xl text-blue-700 mb-2">Ваш заказ в пути!</h2>
            <p className="text-blue-600 text-sm">Курьер уже выехал к вам</p>
            <div className="mt-4">
              <p className="text-3xl font-mono font-bold text-blue-600">
                {formatTime(timeLeft)}
              </p>
              <p className="text-xs text-gray-500">Осталось времени на получение</p>
            </div>
          </div>
        )}

        {/* Заказ доставлен */}
        {order.status === 'delivered' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="font-bold text-xl text-green-700 mb-2">Заказ успешно доставлен!</h2>
            <p className="text-green-600 text-sm mt-1">Спасибо, что выбрали нас</p>
          </div>
        )}

        {/* Запрос на возврат отправлен */}
        {order.refund_status === 'requested' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <div className="text-5xl mb-3">⏳</div>
            <h2 className="font-bold text-xl text-yellow-700 mt-2">Запрос на возврат отправлен</h2>
            <p className="text-yellow-600 text-sm mt-1">Администратор рассмотрит ваш запрос</p>
          </div>
        )}

        {/* Карта */}
        {(order.status === 'out_for_delivery' || order.status === 'nearby' || order.status === 'delivered') && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Карта доставки</h2>
            <DeliveryMap
              supplierLat={order.supplier_lat}
              supplierLon={order.supplier_lon}
              customerLat={order.customer_lat}
              customerLon={order.customer_lon}
              supplierName={order.supplier_name}
              customerAddress={order.customer_address || 'Адрес доставки'}
              userLat={location?.lat}
              userLon={location?.lon}
              orderStatus={order.status}
            />
          </div>
        )}

        {/* Информация о курьере */}
        {order.assigned_courier && order.status !== 'delivered' && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4">Курьер</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                {order.assigned_courier.courier_type === 'driver' ? '🚗' : '🚶'}
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {order.assigned_courier.first_name} {order.assigned_courier.last_name}
                </p>
                <p className="text-sm text-gray-500">{order.assigned_courier.phone}</p>
              </div>
              <button
                onClick={() => window.location.href = `tel:${order.assigned_courier?.phone}`}
                className="bg-[#367666] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2a5a4d] transition"
              >
                Позвонить
              </button>
            </div>
          </div>
        )}

        {/* Детали заказа */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Детали заказа</h2>
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
              <span className="font-bold text-[#367666]">{order.amount_paid} ₸</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Адрес доставки:</span>
              <span className="font-medium text-sm text-right">{order.customer_address || 'Адрес не указан'}</span>
            </div>
          </div>
        </div>

        {/* Кнопка возврата - ТОЛЬКО ДЛЯ КЛИЕНТА */}
        {isCustomer && order.status === 'out_for_delivery' && order.payment_status !== 'refunded' && (
          <button
            onClick={() => setShowRefundModal(true)}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Отказаться от заказа
          </button>
        )}
      </div>

      {/* ✅ МОДАЛЬНОЕ ОКНО - ТОЛЬКО ДЛЯ КЛИЕНТА */}
      {showConfirmModal && isCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">📦</div>
              <h2 className="text-2xl font-bold text-gray-800">Подтвердите получение</h2>
              <p className="text-gray-500 text-sm mt-2">
                Вы уверены, что получили заказ?<br />
                После подтверждения заказ будет считаться доставленным.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">Заказ #{order?.order_number}</p>
              <p className="font-medium text-gray-800">{order?.bag_name}</p>
              <p className="text-sm text-gray-500">Сумма: {order?.amount_paid} ₸</p>
              {order?.assigned_courier && (
                <p className="text-sm text-gray-500 mt-2">
                  Курьер: {order.assigned_courier.first_name} {order.assigned_courier.last_name}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelivery}
                disabled={confirmLoading}
                className="flex-1 bg-[#367666] text-white py-3 rounded-xl font-semibold hover:bg-[#2a5a4d] transition disabled:opacity-50"
              >
                {confirmLoading ? 'Подтверждение...' : '✅ Да, получил'}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно отказа - ТОЛЬКО ДЛЯ КЛИЕНТА */}
      {showRefundModal && isCustomer && (
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
              className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#367666]"
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
          </div>
        </div>
      )}
    </div>
  );
}