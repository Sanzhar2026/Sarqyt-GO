// app/orders/page.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../components/LanguageSwitcher';
import { getUserOrders, getAuthToken, type Order } from '../../lib/api';
import OrderStatusBadge from '../components/OrderStatusBadge';

export default function OrdersPage() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      console.log('❌ Нет токена, редирект на логин');
      router.push('/login');
      return;
    }
    
    console.log('✅ Токен есть, загружаем заказы');
    
    getUserOrders()
      .then((data) => {
        console.log('📦 Получено заказов:', data?.length || 0);
        setOrders(data || []);
        setError(null);
      })
      .catch((err) => {
        console.error('❌ Ошибка загрузки заказов:', err);
        
        // ✅ Проверяем статус
        if (err.message?.includes('401') || err.message?.includes('403')) {
          sessionStorage.removeItem('userToken');
          sessionStorage.removeItem('user');
          localStorage.removeItem('access_token');
          router.push('/login');
          return;
        }
        
        setError(err.message || 'Ошибка загрузки заказов');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const getOrderName = (order: Order): string => {
    return order.bag_name || 
           order.surprise_bag_name || 
           `Заказ #${order.order_number}`;
  };

  const getOrderAmount = (order: Order): number => {
    return order.amount_paid || order.amount || 0;
  };

  const getSupplierName = (order: Order): string => {
    return order.supplier_name || 'Продавец';
  };

  const getAddress = (order: Order): string => {
    return order.customer_address || order.address || 'Адрес не указан';
  };

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: t('pending'),
      confirmed: t('confirmed'),
      preparing: t('preparing'),
      ready_for_pickup: t('readyForPickup'),
      out_for_delivery: t('outForDelivery'),
      nearby: t('nearby'),
      waiting_confirmation: 'Ожидает подтверждения',
      delivered: t('delivered'),
      cancelled: t('cancelled'),
      rejected: 'Отклонен',
      refunded: 'Возврат'
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('error')}</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#367666] text-white px-6 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{t('myOrders')}</h1>
            <p className="text-white/70 text-sm mt-1">
              {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              getUserOrders()
                .then(setOrders)
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }}
            className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition"
          >
            🔄 {t('refresh')}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('noOrders')}</h3>
            <p className="text-gray-500 text-sm mb-6">
              {t('noOrdersDesc')}
            </p>
            <Link href="/">
              <button className="bg-[#367666] text-white px-8 py-3 rounded-xl hover:bg-[#2a5a4d] transition font-medium">
                {t('findSurpriseBtn')}
              </button>
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-[#367666]/20 active:scale-[0.98]">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400 font-mono">
                        #{order.order_number}
                      </p>
                      <span className="text-xs text-gray-300">•</span>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <h3 className="font-semibold text-lg mt-1 text-gray-800 line-clamp-1">
                      {getOrderName(order)}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-1">
                      {order.delivery_type === 'delivery' ? '🚚 Доставка' : '🏪 Самовывоз'}
                    </p>
                    {getAddress(order) && (
                      <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">
                        📍 {getAddress(order)}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <OrderStatusBadge status={order.status} lang={lang} />
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400">{t('orderAmount')}</p>
                    <p className="text-[#367666] font-bold text-lg">
                      {getOrderAmount(order)} ₸
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{t('orderStatus')}</p>
                    <p className="text-sm font-medium text-gray-700">
                      {getStatusText(order.status)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}