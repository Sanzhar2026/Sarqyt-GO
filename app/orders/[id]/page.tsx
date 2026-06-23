// app/orders/[id]/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ С ПРАВИЛЬНЫМИ ПОЛЯМИ

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getOrderById, getAuthToken, type Order } from '../../../lib/api'
import { translations, type Language } from '../../../lib/i18n'
import OrderStatusBadge from '../../components/OrderStatusBadge'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lang] = useState<Language>('ru')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const t = translations[lang]

  const orderId = params.id as string

  useEffect(() => {
    const token = getAuthToken()
    
    if (!token) {
      console.log('❌ Нет токена, редирект на логин')
      router.push('/login')
      return
    }

    if (!orderId) {
      setError('ID заказа не указан')
      setLoading(false)
      return
    }

    console.log('📦 Загружаем заказ ID:', orderId)
    
    getOrderById(Number(orderId))
      .then((data) => {
        console.log('✅ Заказ загружен:', data)
        setOrder(data)
        setError(null)
      })
      .catch((err) => {
        console.error('❌ Ошибка загрузки заказа:', err)
        setError(err.message || 'Заказ не найден')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [orderId, router])

  // Функция подтверждения получения заказа
  const handleConfirmDelivery = async () => {
    if (!order) return
    
    setConfirming(true)
    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      console.log('📤 Подтверждение получения заказа:', order.id)
      
      const response = await fetch(`/api/orders/${order.id}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Заказ подтвержден:', data)
        alert('✅ Заказ успешно подтвержден!')
        
        // Обновляем статус заказа
        setOrder({
          ...order,
          status: 'delivered'
        })
        
        // Обновляем страницу через 2 секунды
        setTimeout(() => {
          router.push('/orders')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('❌ Ошибка подтверждения:', errorData)
        alert(errorData.detail || '❌ Ошибка при подтверждении заказа')
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err)
      alert('❌ Ошибка сети. Попробуйте позже.')
    } finally {
      setConfirming(false)
    }
  }

  // Функция отмены заказа
  const handleCancelOrder = async () => {
    if (!order) return
    
    if (!confirm('Вы уверены, что хотите отменить заказ?')) return
    
    try {
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      console.log('📤 Отмена заказа:', order.id)
      
      const response = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        console.log('✅ Заказ отменен')
        alert('✅ Заказ успешно отменен!')
        
        setOrder({
          ...order,
          status: 'cancelled'
        })
        
        setTimeout(() => {
          router.push('/orders')
        }, 2000)
      } else {
        const errorData = await response.json()
        console.error('❌ Ошибка отмены:', errorData)
        alert(errorData.detail || '❌ Ошибка при отмене заказа')
      }
    } catch (err) {
      console.error('❌ Ошибка сети:', err)
      alert('❌ Ошибка сети. Попробуйте позже.')
    }
  }

  // ✅ Функция для получения названия заказа
  const getOrderName = (order: Order): string => {
    return order.bag_name || 
           order.surprise_bag_name || 
           `Заказ #${order.order_number}`
  }

  // ✅ Функция для получения суммы заказа (используем amount)
  const getOrderAmount = (order: Order): number => {
    return order.amount || order.amount_paid || 0
  }

  // ✅ Функция для получения адреса (используем address)
  const getAddress = (order: Order): string => {
    return order.address || 'Адрес не указан'
  }

  // ✅ Функция для получения типа доставки
  const getDeliveryType = (order: Order): string => {
    return order.delivery_type || 'pickup'
  }

  // ✅ Функция для получения имени поставщика
  const getSupplierName = (order: Order): string => {
    return order.supplier_name || 'Не указан'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-500 mb-6">{error || 'Заказ не найден'}</p>
          <Link href="/orders">
            <button className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition">
              Вернуться к заказам
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#367666] text-white px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition text-white text-xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold">Заказ #{order.order_number}</h1>
            <p className="text-white/70 text-sm">
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

      {/* Контент */}
      <div className="p-6 space-y-4">
        {/* Статус и сумма */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Статус заказа</p>
              <OrderStatusBadge status={order.status} lang={lang} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Сумма</p>
              <p className="text-2xl font-bold text-[#367666]">
                {getOrderAmount(order)} ₸
              </p>
            </div>
          </div>
        </div>

        {/* Информация о заказе */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Детали заказа</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-gray-500">Товар</span>
              <span className="text-gray-800 font-medium text-right max-w-[60%]">
                {getOrderName(order)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Продавец</span>
              <span className="text-gray-800">{getSupplierName(order)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Способ получения</span>
              <span className="text-gray-800">
                {getDeliveryType(order) === 'delivery' ? '🚚 Доставка' : '🏪 Самовывоз'}
              </span>
            </div>
            {order.address && (
              <div className="flex justify-between items-start">
                <span className="text-gray-500">Адрес</span>
                <span className="text-gray-800 text-right max-w-[60%]">{order.address}</span>
              </div>
            )}
            {order.courier_id && (
              <div className="flex justify-between">
                <span className="text-gray-500">ID курьера</span>
                <span className="text-gray-800">#{order.courier_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* История статусов - если есть */}
        {/* @ts-ignore */}
        {order.status_history && order.status_history.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">История статусов</h3>
            <div className="space-y-3">
              {/* @ts-ignore */}
              {order.status_history.map((history: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      index === 0 ? 'bg-[#367666]' : 'bg-gray-300'
                    }`}></div>
                    {index < order.status_history.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {getStatusText(history.status)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(history.created_at).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {history.comment && (
                      <p className="text-xs text-gray-500 mt-1">{history.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex flex-col gap-3 pt-4">
          {/* Кнопка подтверждения получения */}
          {order.status === 'out_for_delivery' && (
            <button
              onClick={handleConfirmDelivery}
              disabled={confirming}
              className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold hover:bg-[#2a5a4d] transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {confirming ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Подтверждение...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>Подтвердить получение</span>
                </>
              )}
            </button>
          )}

          {/* Кнопка отмены заказа */}
          {['pending', 'confirmed'].includes(order.status) && (
            <button
              onClick={handleCancelOrder}
              className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold hover:bg-red-600 transition active:scale-[0.98]"
            >
              ❌ Отменить заказ
            </button>
          )}

          {/* Кнопка возврата */}
          <Link href="/orders">
            <button className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition active:scale-[0.98]">
              ← Вернуться к заказам
            </button>
          </Link>
        </div>
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