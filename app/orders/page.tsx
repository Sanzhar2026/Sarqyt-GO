// app/orders/page.tsx - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUserOrders, getAuthToken, type Order } from '../../lib/api'
import { translations, type Language } from '../../lib/i18n'
import OrderStatusBadge from '../components/OrderStatusBadge'

export default function OrdersPage() {
  const [lang] = useState<Language>('ru')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const t = translations[lang]

  useEffect(() => {
    const token = getAuthToken()
    
    if (!token) {
      console.log('❌ Нет токена, редирект на логин')
      router.push('/login')
      return
    }
    
    console.log('✅ Токен есть, загружаем заказы')
    console.log('🔑 Токен:', token.substring(0, 20) + '...')
    
    getUserOrders()
      .then((data) => {
        console.log('📦 Получено заказов:', data?.length || 0)
        setOrders(data || [])
        setError(null)
      })
      .catch((err) => {
        console.error('❌ Ошибка загрузки заказов:', err)
        setError(err.message || 'Ошибка загрузки заказов')
        
        if (err.status === 401 || err.message?.includes('401')) {
          // Токен невалидный - удаляем и редиректим
          sessionStorage.removeItem('userToken')
          sessionStorage.removeItem('user')
          localStorage.removeItem('access_token')
          router.push('/login')
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [router])

  // Рендер загрузки
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666] mx-auto"></div>
          <p className="text-gray-500 mt-4 text-sm">Загрузка заказов...</p>
        </div>
      </div>
    )
  }

  // Рендер ошибки
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              const token = getAuthToken()
              if (token) {
                getUserOrders()
                  .then(setOrders)
                  .catch((err) => setError(err.message))
                  .finally(() => setLoading(false))
              }
            }}
            className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#367666] text-white px-6 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{t.myOrders || 'Мои заказы'}</h1>
            <p className="text-white/70 text-sm mt-1">
              {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              getUserOrders()
                .then(setOrders)
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false))
            }}
            className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition"
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      {/* Список заказов */}
      <div className="p-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Нет заказов</h3>
            <p className="text-gray-500 text-sm mb-6">
              У вас пока нет заказов. <br />
              Найдите сюрприз-пакет и сделайте заказ!
            </p>
            <Link href="/">
              <button className="bg-[#367666] text-white px-8 py-3 rounded-xl hover:bg-[#2a5a4d] transition font-medium">
                Найти сюрпризы
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
                      {order.bag_name || order.surprise_bag_name || 'Сюрприз-пакет'}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-1">
                      {order.supplier_name || 'Продавец'}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <OrderStatusBadge status={order.status} lang={lang} />
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400">Сумма</p>
                    <p className="text-[#367666] font-bold text-lg">
                      {order.amount_paid || 0} ₸
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Статус</p>
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
  )
}

// Вспомогательная функция для отображения статуса на русском
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Ожидается',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    ready_for_pickup: 'Готов к выдаче',
    out_for_delivery: 'Доставляется',
    nearby: 'Курьер рядом',
    waiting_confirmation: 'Ожидает подтверждения',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
    rejected: 'Отклонен',
    refunded: 'Возврат'
  }
  return statusMap[status] || status
}