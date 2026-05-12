'use client'

import { useState, useEffect } from 'react'
import { translations, type Language } from '@/lib/i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface CartItem {
  id: number
  name: string
  price: number
  supplier: string
}

export default function CartPage() {
  const [lang, setLang] = useState<Language>('ru')
  const [cart, setCart] = useState<CartItem[]>([])
  const t = translations[lang]

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) {
      setCart(JSON.parse(saved))
    }
  }, [])

  const total = cart.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">{t.cart}</h1>
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
      </div>

      <div className="p-6">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t.cartEmpty}</p>
          </div>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-4 mb-4">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-500 text-sm">{item.supplier}</p>
                <p className="text-emerald-600 font-bold mt-2">{item.price} ₸</p>
              </div>
            ))}
            <div className="bg-white rounded-3xl p-6 mt-6">
              <div className="flex justify-between text-lg font-semibold">
                <span>{t.total}</span>
                <span>{total} ₸</span>
              </div>
              <button className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-2xl font-semibold">
                {t.checkout}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}