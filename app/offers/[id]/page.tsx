'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'

interface Order {
  order_id: number
  order_number: string
  status: string
  delivery_status: string
  bag_name: string
  supplier_name: string
  supplier_address: string
  customer_address: string
  amount_paid: number
  pickup_time: string
  created_at: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      const resolvedParams = await params
      const orderId = resolvedParams?.id
      
      if (!orderId) return
      
      try {
        const response = await fetch(`http://localhost:8000/api/orders/${orderId}`)
        if (!response.ok) throw new Error('Order not found')
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        console.error(err)
        setError('Заказ не найден')
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrder()
  }, [params])

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'confirmed': return 'bg-blue-500'
      case 'preparing': return 'bg-purple-500'
      case 'ready_for_pickup': return 'bg-orange-500'
      case 'out_for_delivery': return 'bg-indigo-500'
      case 'delivered': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Status text in Kazakh/Russian
  const getStatusText = (status: string, lang: string = 'kz') => {
    const statusMap: Record<string, { kz: string; ru: string }> = {
      pending: { kz: 'Күтілуде', ru: 'Ожидается' },
      confirmed: { kz: 'Расталды', ru: 'Подтвержден' },
      preparing: { kz: 'Дайындалуда', ru: 'Готовится' },
      ready_for_pickup: { kz: 'Дайын', ru: 'Готов к выдаче' },
      out_for_delivery: { kz: 'Жеткізілуде', ru: 'Доставляется' },
      delivered: { kz: 'Жеткізілді', ru: 'Доставлен' },
      cancelled: { kz: 'Бас тартылды', ru: 'Отменен' }
    }
    return statusMap[status]?.[lang] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6">
        <button onClick={() => router.back()} className="mb-4 text-white">
          ← Назад
        </button>
        <h1 className="text-2xl font-bold">Заказ #{order.order_number}</h1>
        <p className="opacity-90 mt-1">от {new Date(order.created_at).toLocaleDateString()}</p>
      </div>

      <div className="px-6 py-8">
        {/* Status */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Статус:</span>
            <span className={`${getStatusColor(order.status)} text-white px-4 py-1 rounded-full text-sm`}>
              {getStatusText(order.status, 'ru')}
            </span>
          </div>
          
          {/* Progress bar */}
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
                style={{ 
                  width: order.status === 'pending' ? '20%' :
                         order.status === 'confirmed' ? '40%' :
                         order.status === 'preparing' ? '60%' :
                         order.status === 'ready_for_pickup' ? '75%' :
                         order.status === 'out_for_delivery' ? '90%' : '100%'
                }}
              />
            </div>
          </div>
        </div>

        {/* Order details */}
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

        {/* Location */}
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

        {/* Map placeholder */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">🗺️ Маршрут</h2>
          <div className="bg-gray-200 rounded-xl h-48 flex items-center justify-center">
            <p className="text-gray-500">Карта загрузки...</p>
          </div>
        </div>
      </div>
    </div>
  )
}