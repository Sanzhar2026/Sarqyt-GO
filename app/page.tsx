'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://toogood-2ncf.onrender.com',
})

interface SurpriseBag {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  discount_percentage: number
  image_url: string
}

export default function Home() {
  const [location, setLocation] = useState<{ lat: number | null; lon: number | null }>({ lat: null, lon: null })

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      })
    }
  }, [])

  const { data: bags, isLoading } = useQuery({
    queryKey: ['surprise-bags', location.lat, location.lon],
    queryFn: async () => {
      if (!location.lat || !location.lon) return []
      const res = await api.get('/api/surprise-bags/nearby', {
        params: { lat: location.lat, lon: location.lon, radius: 10 }
      })
      return res.data
    },
    enabled: !!location.lat && !!location.lon,
  })

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>
  }

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-green-600 text-white p-4 shadow-lg">
        <h1 className="text-xl font-bold">🌱 Sarqyn Food</h1>
        <p className="text-sm">Спасай еду со скидкой до 70%</p>
      </header>
      
      <main className="p-4 space-y-4">
        {bags?.length > 0 ? (
          bags.map((bag: SurpriseBag) => (
            <div key={bag.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <img src={bag.image_url} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-lg">{bag.name}</h3>
                <p className="text-gray-500 text-sm">{bag.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="line-through text-gray-400">{bag.original_price} ₸</span>
                  <span className="text-red-500 font-bold text-xl">{bag.discounted_price} ₸</span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">-{bag.discount_percentage}%</span>
                </div>
                <button className="mt-3 w-full bg-yellow-400 text-green-800 py-3 rounded-xl font-bold">
                  Забрать →
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p>😔 Рядом нет сюрпризов</p>
            <button onClick={() => {
              navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
              })
            }} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-full">
              Определить местоположение
            </button>
          </div>
        )}
      </main>
    </div>
  )
}