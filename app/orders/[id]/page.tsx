// app/orders/[id]/page.tsx - ПОЛНАЯ ВЕРСИЯ С ГЕОЛОКАЦИЕЙ КУРЬЕРА

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getOrderById, getAuthToken, type Order } from '../../../lib/api';
import { useLanguage } from '../../components/LanguageSwitcher';
import OrderStatusBadge from '../../components/OrderStatusBadge';

// ✅ ДИНАМИЧЕСКИЙ ИМПОРТ КАРТЫ
const CourierMap = dynamic(() => import('../../components/CourierMap'), { ssr: false });

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  
  // ✅ СОСТОЯНИЯ ДЛЯ КУРЬЕРА
  const [courierLocation, setCourierLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [courierOnline, setCourierOnline] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [deliveryProgress, setDeliveryProgress] = useState<number>(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const orderId = params.id as string;

  // ============================================================
  // ✅ WEBSOCKET ДЛЯ ОТСЛЕЖИВАНИЯ КУРЬЕРА
  // ============================================================
  useEffect(() => {
    const token = getAuthToken();
    if (!token || !orderId) return;

    const ws = new WebSocket(`wss://toogood-production.up.railway.app/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket для отслеживания заказа подключен');
      // Подписываемся на обновления заказа
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: `order_${orderId}`
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Получено сообщение:', data);

        if (data.type === 'courier_location') {
          setCourierLocation({ lat: data.lat, lon: data.lon });
          setCourierOnline(true);
          
          // Обновляем прогресс доставки
          if (data.progress !== undefined) {
            setDeliveryProgress(data.progress);
          }
        }

        if (data.type === 'order_status_updated') {
          setOrderStatus(data.new_status);
          if (data.new_status === 'delivered') {
            setDeliveryProgress(100);
          }
        }

        if (data.type === 'delivery_started') {
          setOrderStatus('out_for_delivery');
        }

        if (data.type === 'courier_arrived') {
          setOrderStatus('nearby');
          setDeliveryProgress(90);
        }

        if (data.type === 'delivery_confirmed_by_customer') {
          setOrderStatus('delivered');
          setDeliveryProgress(100);
          showNotification('✅ Заказ доставлен!', 'success');
        }

        if (data.type === 'order_cancelled') {
          setOrderStatus('cancelled');
          showNotification('❌ Заказ отменен', 'error');
        }

      } catch (error) {
        console.error('WebSocket error:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket отключен');
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          // Попытка переподключения
        }
      }, 3000);
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, [orderId]);

  // ============================================================
  // ✅ ЗАГРУЗКА ЗАКАЗА
  // ============================================================
  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      console.log('❌ Нет токена, редирект на логин');
      router.push('/login');
      return;
    }

    if (!orderId) {
      setError('ID заказа не указан');
      setLoading(false);
      return;
    }

    console.log('📦 Загружаем заказ ID:', orderId);
    
    getOrderById(Number(orderId))
      .then((data) => {
        console.log('✅ Заказ загружен:', data);
        setOrder(data);
        setOrderStatus(data.status);
        setError(null);
      })
      .catch((err) => {
        console.error('❌ Ошибка загрузки заказа:', err);
        setError(err.message || 'Заказ не найден');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, router]);

  // ============================================================
  // ✅ ПОЛУЧЕНИЕ ГЕОЛОКАЦИИ КУРЬЕРА
  // ============================================================
  const fetchCourierLocation = async () => {
    if (!order) return;
    
    const token = getAuthToken();
    try {
      const response = await fetch(`/api/order/${order.id}/delivery-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.has_courier && data.courier) {
        setCourierOnline(true);
        // Если есть координаты курьера
        if (data.courier.lat && data.courier.lon) {
          setCourierLocation({ lat: data.courier.lat, lon: data.courier.lon });
        }
      }
    } catch (error) {
      console.error('Error fetching courier location:', error);
    }
  };

  // Периодическое обновление геолокации
  useEffect(() => {
    if (order && ['confirmed', 'out_for_delivery', 'nearby'].includes(orderStatus)) {
      fetchCourierLocation();
      const interval = setInterval(fetchCourierLocation, 10000);
      return () => clearInterval(interval);
    }
  }, [order, orderStatus]);

  // ============================================================
  // ✅ ФУНКЦИИ
  // ============================================================
  const handleConfirmDelivery = async () => {
    if (!order) return;
    
    setConfirming(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      console.log('📤 Подтверждение получения заказа:', order.id);
      
      const response = await fetch(`/api/customer/confirm-delivery/${order.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Заказ подтвержден:', data);
        showNotification(t('deliveryConfirmed'), 'success');
        
        setOrder({
          ...order,
          status: 'delivered'
        });
        setOrderStatus('delivered');
        setDeliveryProgress(100);
        
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('❌ Ошибка подтверждения:', errorData);
        showNotification(errorData.detail || t('confirmError'), 'error');
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err);
      showNotification(t('networkError'), 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (!confirm(t('confirmCancel'))) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      console.log('📤 Отмена заказа:', order.id);
      
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('✅ Заказ отменен');
        showNotification(t('orderCancelled'), 'success');
        
        setOrder({
          ...order,
          status: 'cancelled'
        });
        setOrderStatus('cancelled');
        
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('❌ Ошибка отмены:', errorData);
        showNotification(errorData.detail || t('cancelError'), 'error');
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err);
      showNotification(t('networkError'), 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-[#367666]',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    toast.className = `fixed bottom-20 left-4 right-4 z-50 p-3 rounded-xl text-white text-center animate-slide-up text-sm ${colors[type]}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getOrderName = (order: Order): string => {
    return order.bag_name || 
           order.surprise_bag_name || 
           `${t('order')} #${order.order_number}`;
  };

  const getOrderAmount = (order: Order): number => {
    return order.amount || order.amount_paid || 0;
  };

  const getSupplierName = (order: Order): string => {
    return order.supplier_name || t('unknown');
  };

  const getSupplierLogo = (order: Order): string | null => {
    return order.supplier_logo || order.supplier?.logo || null;
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Ожидает',
      'confirmed': 'Подтвержден',
      'preparing': 'Готовится',
      'ready_for_pickup': 'Готов к выдаче',
      'picked_up': 'Забран курьером',
      'out_for_delivery': 'В пути',
      'nearby': 'Курьер рядом',
      'waiting_confirmation': 'Ожидает подтверждения',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('error')}</h2>
          <p className="text-gray-500 mb-6">{error || t('orderNotFound')}</p>
          <Link href="/orders">
            <button className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition">
              {t('backToOrders')}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const supplierLogo = getSupplierLogo(order);
  const supplierName = getSupplierName(order);
  const isDeliveryInProgress = ['confirmed', 'out_for_delivery', 'nearby', 'waiting_confirmation'].includes(orderStatus);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header с аватаркой */}
      <div className="bg-[#367666] text-white px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition text-white text-xl"
          >
            ←
          </button>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50 flex-shrink-0">
              {supplierLogo ? (
                <Image
                  src={supplierLogo}
                  alt={supplierName}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('span');
                      fallback.className = 'text-xl font-bold text-white';
                      fallback.textContent = supplierName.charAt(0).toUpperCase();
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {supplierName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">
                {t('order')} #{order.order_number}
              </h1>
              <p className="text-white/70 text-sm truncate">
                {supplierName}
              </p>
              <p className="text-white/50 text-xs">
                {new Date(order.created_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="p-6 space-y-4">
        {/* Статус и сумма */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('orderStatus')}</p>
              <OrderStatusBadge status={order.status} lang={lang} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">{t('orderAmount')}</p>
              <p className="text-2xl font-bold text-[#367666]">
                {getOrderAmount(order)} ₸
              </p>
            </div>
          </div>
        </div>

        {/* ✅ КАРТА С МАРШРУТОМ И КУРЬЕРОМ */}
        {isDeliveryInProgress && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span>📍</span> Отслеживание доставки
              </h3>
              {courierOnline ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Курьер в пути
                </span>
              ) : (
                <span className="text-xs text-gray-400">Курьер не назначен</span>
              )}
            </div>
            
            <div className="relative h-56 rounded-xl overflow-hidden border border-gray-200">
              <CourierMap
                orderId={order.id}
                restaurantLocation={order.supplier_lat ? { 
                  lat: order.supplier_lat, 
                  lon: order.supplier_lon 
                } : order.supplier?.lat ? { 
                  lat: order.supplier.lat, 
                  lon: order.supplier.lon 
                } : undefined}
                customerLocation={order.customer_lat ? { 
                  lat: order.customer_lat, 
                  lon: order.customer_lon 
                } : undefined}
                courierLocation={courierLocation || undefined}
                height="100%"
                showRoute={true}
                routeColor="#3b82f6"
                routeWidth={3}
                showUserLocation={true}
              />
            </div>
            
            {/* Прогресс доставки */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Заказ принят</span>
                <span>Доставлен</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#367666] rounded-full transition-all duration-500"
                  style={{ width: `${deliveryProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">
                {getStatusText(orderStatus)}
              </p>
            </div>
          </div>
        )}

        {/* Информация о заказе */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">{t('orderDetails')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-gray-500">{t('product')}</span>
              <span className="text-gray-800 font-medium text-right max-w-[60%]">
                {getOrderName(order)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('supplier')}</span>
              <span className="text-gray-800">{supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('deliveryTypeLabel')}</span>
              <span className="text-gray-800">
                {order.delivery_type === 'delivery' ? t('delivery') : t('pickup')}
              </span>
            </div>
            {order.address && (
              <div className="flex justify-between items-start">
                <span className="text-gray-500">{t('address')}</span>
                <span className="text-gray-800 text-right max-w-[60%]">{order.address}</span>
              </div>
            )}
            
            {/* Информация о курьере */}
            {courierOnline && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-gray-500">Курьер</span>
                <span className="text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  В пути
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col gap-3 pt-4">
          {orderStatus === 'waiting_confirmation' && (
            <button
              onClick={handleConfirmDelivery}
              disabled={confirming}
              className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold hover:bg-[#2a5a4d] transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>{t('confirming')}</span>
                </>
              ) : (
                <span>{t('confirmDelivery')}</span>
              )}
            </button>
          )}

          {['pending', 'confirmed', 'waiting_confirmation'].includes(orderStatus) && (
            <button
              onClick={handleCancelOrder}
              className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold hover:bg-red-600 transition active:scale-[0.98]"
            >
              {t('cancelOrder')}
            </button>
          )}

          <Link href="/orders">
            <button className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition active:scale-[0.98]">
              {t('backToOrders')}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}