'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getUserOrders, type Order } from '../../lib/api'
import { translations, type Language } from '../../lib/i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'
import OrderStatusBadge from '../components/OrderStatusBadge'

export default function OrdersPage() {
  const [lang, setLang] = useState<Language>('ru')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const t = translations[lang]

  useEffect(() => {
    // Временно используем user_id = 1 (потом заменим на авторизацию)
    getUserOrders(1)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">{t.myOrders}</h1>
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl">
            <p className="text-gray-500">{t.noOrders}</p>
            <Link href="/">
              <button className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-full">
                {t.reserve}
              </button>
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">{order.order_number}</p>
                    <h3 className="font-semibold text-lg mt-1">{order.surprise_bag_name}</h3>
                    <p className="text-gray-500 text-sm">{order.supplier_name}</p>
                  </div>
                  <OrderStatusBadge status={order.status} lang={lang} />
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-emerald-600 font-bold">{order.amount_paid} ₸</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}