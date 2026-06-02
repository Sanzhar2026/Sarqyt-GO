'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

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
  const [location, setLocation] = useState<{ lat: number; lon: number; city: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // ✅ Функция для получения токена из разных источников
  const getAuthToken = () => {
    // Пробуем из sessionStorage
    let token = sessionStorage.getItem('authToken');
    
    // Если нет, пробуем из localStorage
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    // Если нет, пробуем из sessionStorage с другим ключом
    if (!token) {
      token = sessionStorage.getItem('token');
    }
    
    console.log('🔑 Токен получен:', !!token);
    return token;
  };

  // ✅ Функция для авторизованных запросов с проверкой 403
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    console.log(`📡 Запрос к ${url}, токен: ${!!token}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
    
    // Если 401 или 403 - перенаправляем на логин
    if (response.status === 401 || response.status === 403) {
      console.error(`❌ Ошибка авторизации ${response.status}, перенаправление на логин...`);
      
      // Очищаем все токены
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      
      // Сохраняем текущий URL для возврата
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      // Перенаправляем на логин
      router.push('/login');
      throw new Error('Unauthorized');
    }
    
    return response;
  };

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
  const fetchOrder = async () => {
    const orderId = params?.id;
    if (!orderId) return;
    
    try {
      const token = getAuthToken();
      console.log('🔑 Токен для запроса заказа:', !!token);
      console.log('📦 Запрашиваем заказ:', orderId);
      
      const response = await authFetch(`${API_URL}/api/orders/${orderId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка ответа:', response.status, errorText);
        throw new Error(`Order not found: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Заказ получен:', data);
      setOrder(data);
    } catch (err) {
      console.error('❌ Ошибка загрузки заказа:', err);
      setError('Заказ не найден');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params?.id]);

  // WebSocket для получения уведомлений о прибытии курьера
  useEffect(() => {
    const orderId = params?.id;
    if (!orderId) return;

    const token = getAuthToken();
    const wsUrl = token 
      ? `wss://toogood-2ncf.onrender.com/ws?token=${encodeURIComponent(token)}`
      : 'wss://toogood-2ncf.onrender.com/ws';
    
    console.log('🔌 Подключение WebSocket для заказа:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🔌 WebSocket connected for order');
      ws.send(JSON.stringify({ type: 'subscribe', channel: `order_${orderId}` }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Получено уведомление:', data);
        
        if (data.type === 'courier_arrived') {
          showToast(`${data.data.message || 'Курьер прибыл!'} ${data.data.courier_name} ожидает вас.`, 'info');
          fetchOrder();
        }
        
        if (data.type === 'order_status_updated') {
          showToast(`Статус заказа изменен на: ${data.data.status}`, 'info');
          fetchOrder();
        }
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };
    
    return () => ws.close();
  }, [params?.id]);

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

  // КЛИЕНТ ПОДТВЕРЖДАЕТ ПОЛУЧЕНИЕ ЗАКАЗА
  const confirmDelivery = async () => {
    if (!order) return;
    
    setConfirming(true);
    try {
      const response = await authFetch(`${API_URL}/api/customer/confirm-delivery/${order.id}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('✅ Спасибо! Заказ получен.', 'success');
        fetchOrder();
      } else {
        alert(data.message || 'Ошибка');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка при подтверждении');
    } finally {
      setConfirming(false);
    }
  };

  // КЛИЕНТ ЗАПРАШИВАЕТ ВОЗВРАТ
  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      alert('Укажите причину возврата');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await authFetch(`${API_URL}/api/order/${order?.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason })
      });
      
      if (response.ok) {
        alert('✅ Запрос на возврат отправлен. Администратор рассмотрит его в ближайшее время.');
        setShowRefundModal(false);
        setRefundReason('');
        fetchOrder();
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
    toast.className = 'fixed bottom-20 left-4 right-4 z-50 animate-slide-up';
    
    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    toast.innerHTML = `
      <div class="${bgColor} rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <span class="text-white text-xl">${icon}</span>
        <p class="flex-1 text-white text-sm font-medium">${message}</p>
        <button class="close-toast text-white opacity-70 text-xl leading-none">✕</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    const close = () => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    };
    
    toast.querySelector('.close-toast')?.addEventListener('click', close);
    setTimeout(close, 3000);
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

        {/* КНОПКА ДЛЯ КЛИЕНТА - ПОДТВЕРЖДЕНИЕ ПОЛУЧЕНИЯ */}
        {order.status === 'nearby' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <div className="text-5xl mb-3">🚚</div>
            <h2 className="font-bold text-xl text-green-700 mb-2">Курьер рядом!</h2>
            {order.assigned_courier && (
              <p className="text-green-600 text-sm mb-2">
                {order.assigned_courier.first_name} {order.assigned_courier.last_name} ожидает вас
              </p>
            )}
            <p className="text-green-600 text-sm mb-4">
              Курьер уже у вашей двери. Подтвердите получение заказа.
            </p>
            <button
              onClick={confirmDelivery}
              disabled={confirming}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg"
            >
              {confirming ? 'Подтверждение...' : '✅ ПОЛУЧИЛ ЗАКАЗ'}
            </button>
          </div>
        )}

        {/* Заказ в пути */}
        {order.status === 'out_for_delivery' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 text-center shadow-sm">
            <div className="text-5xl mb-3">🚚</div>
            <h2 className="font-bold text-xl text-blue-700 mb-2">Ваш заказ в пути!</h2>
            <p className="text-blue-600 text-sm">Курьер уже выехал к вам</p>
            <div className="mt-4">
              <p className="text-3xl font-mono font-bold text-blue-600">
                ⏱️ {formatTime(timeLeft)}
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
            <h2 className="font-bold text-lg mb-4">🗺️ Карта доставки</h2>
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
            <h2 className="font-bold text-lg mb-4">🚚 Курьер</h2>
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
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                📞 Позвонить
              </button>
            </div>
          </div>
        )}

        {/* Детали заказа */}
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
            <div className="flex justify-between">
              <span className="text-gray-600">Адрес доставки:</span>
              <span className="font-medium text-sm text-right">{order.customer_address || 'Адрес не указан'}</span>
            </div>
          </div>
        </div>

        {/* Кнопка возврата */}
        {order.status === 'out_for_delivery' && order.payment_status !== 'refunded' && (
          <button
            onClick={() => setShowRefundModal(true)}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            ❌ Отказаться от заказа
          </button>
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
          </div>
        </div>
      )}
    </div>
  );
}