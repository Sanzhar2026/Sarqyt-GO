'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import dynamic from 'next/dynamic'

// Динамический импорт карты (без SSR)
const ClientMap = dynamic(() => import('@/app/components/ClientMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 animate-pulse rounded-xl" />
})

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
})

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [location, setLocation] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null })

  useEffect(() => {
    setMounted(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      })
    }
  }, [])

  const { data: surpriseBags, isLoading } = useQuery({
    queryKey: ['surprise-bags', location.lat, location.lon],
    queryFn: async () => {
      if (!location.lat || !location.lon) return []
      const res = await api.get('/suppliers/nearby', {
        params: { lat: location.lat, lon: location.lon, radius: 10 }
      })
      return res.data.suppliers || []
    },
    enabled: mounted && !!location.lat && !!location.lon,
  })

  if (!mounted || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-green-600">Загрузка сюрпризов...</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-green-600 text-white p-4 shadow-lg z-10">
        <h1 className="text-xl font-bold">🌱 Sarqyn Food</h1>
        <p className="text-sm opacity-90">Спасай еду со скидкой до 70%</p>
      </header>
      
      <main className="p-4 space-y-4">
        {/* Карта */}
        {location.lat && location.lon && (
          <ClientMap 
            startLat={location.lat} 
            startLon={location.lon}
          />
        )}
        
        {/* Карточки сюрпризов */}
        {surpriseBags?.length > 0 ? (
          surpriseBags.map((supplier: any) => (
            supplier.surprise_bags.map((bag: any) => (
              <div key={bag.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <img 
                  src={bag.image_url} 
                  alt={bag.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-lg">{bag.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{supplier.business_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="line-through text-gray-400">{bag.original_price} ₸</span>
                    <span className="text-red-500 font-bold text-xl">{bag.discounted_price} ₸</span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                      -{bag.discount_percentage}%
                    </span>
                  </div>
                  <button className="mt-3 w-full bg-yellow-400 text-green-800 py-3 rounded-xl font-bold hover:bg-yellow-500 transition">
                    Забрать →
                  </button>
                </div>
              </div>
            ))
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">😔 Рядом нет сюрпризов</p>
            <button 
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-full"
              onClick={() => {
                if ('geolocation' in navigator) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
                  })
                }
              }}
            >
              Определить местоположение
            </button>
          </div>
        )}
      </main>
      
      {/* Нижняя навигация */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 shadow-lg">
        <button className="flex flex-col items-center text-green-600">
          <span className="text-2xl">🏠</span>
          <span className="text-xs">Главная</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-2xl">📦</span>
          <span className="text-xs">Заказы</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-2xl">❤️</span>
          <span className="text-xs">Избранное</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-2xl">👤</span>
          <span className="text-xs">Профиль</span>
        </button>
      </nav>
    </div>
  )
}