'use client'

import { useState } from 'react'
import { translations, type Language } from '../../lib/i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function FavoritesPage() {
  const [lang, setLang] = useState<Language>('ru')
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">{t.favorites}</h1>
        
        </div>
      </div>

      <div className="p-6">
        <div className="text-center py-12 bg-white rounded-3xl">
          <p className="text-gray-500">{t.noFavorites}</p>
        </div>
      </div>
    </div>
  )
}