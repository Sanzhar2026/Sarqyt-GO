'use client'

import { type Supplier } from '../../lib/api'
import { type Language } from '../../lib/i18n'

interface MapProps {
  suppliers: Supplier[]
  userLocation: { lat: number; lon: number }
  lang: Language
}

export default function Map({ suppliers, userLocation, lang }: MapProps) {
  // Здесь будет инициализация Leaflet карты
  // Пока просто заглушка
  console.log('Map would be initialized here with suppliers:', suppliers.length)
  console.log('User location:', userLocation)

  return (
    <div className="bg-gray-200 rounded-3xl overflow-hidden relative h-48 mb-4">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-1">🗺️</div>
          <p className="text-xs text-gray-600">
            {suppliers.length} {lang === 'ru' ? 'сюрпризов рядом' : 'тосын сый жақын маңда'}
          </p>
        </div>
      </div>
    </div>
  )
}