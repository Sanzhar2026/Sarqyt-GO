'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Динамический импорт Leaflet (без SSR)
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-200 animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-gray-500">Загрузка карты...</span>
    </div>
  )
})

export default function MapComponent() {
  return <LeafletMap />
}