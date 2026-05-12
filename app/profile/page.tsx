'use client'

import { useState } from 'react'
import Link from 'next/link'
import { translations, type Language } from '../../lib/i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ProfilePage() {
  const [lang, setLang] = useState<Language>('ru')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-600 text-white pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">{t.profile}</h1>
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <h2 className="text-xl font-semibold">Гость</h2>
            <p className="text-emerald-100 text-sm">Войдите, чтобы увидеть свои заказы</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        <Link href="/login">
          <div className="bg-white p-5 rounded-3xl flex items-center justify-between">
            <span>🔑 {t.login}</span>
            <span>→</span>
          </div>
        </Link>
        <Link href="/orders">
          <div className="bg-white p-5 rounded-3xl flex items-center justify-between">
            <span>📦 {t.myOrders}</span>
            <span>→</span>
          </div>
        </Link>
        <div className="bg-white p-5 rounded-3xl flex items-center justify-between">
          <span>🌍 {t.language}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1 rounded-full text-sm ${lang === 'kz' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded-full text-sm ${lang === 'ru' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
            >
              Рус
            </button>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl flex items-center justify-between text-red-600">
          <span>🚪 {t.logout}</span>
          <span>→</span>
        </div>
      </div>
    </div>
  )
}