'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getNearbyBags, type Supplier } from '../lib/api'

export default function HomePage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; id: number } | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; address: string } | null>(null)

  // Проверка авторизации через cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('https://toogood-2ncf.onrender.com/api/check-auth', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated) {
            setUser({ name: data.user_name, id: data.user_id })
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }
    checkAuth()
  }, [])

  // Получение адреса по координатам
  const getAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=kk`
      )
      const data = await response.json()
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    } catch {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    }
  }

  // Получение геолокации и ближайших поставщиков
  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        const address = await getAddressFromCoords(lat, lon)
        setUserLocation({ lat, lon, address })
        
        try {
          const data = await getNearbyBags(lat, lon, 10)
          setSuppliers(data)
        } catch (error) {
          console.error(error)
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        setLoading(false)
      }
    )
  }, [])

  // Функция выхода
  const handleLogout = async () => {
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/logout', {
        method: 'GET',
        credentials: 'include'
      })
      if (response.ok) {
        setUser(null)
        router.refresh()
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Sarqyn Food</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {user ? `Сәлем, ${user.name}!` : 'Қош келдіңіз!'}
            </p>
          </div>
          
          {/* Кнопка выхода - показывается только если пользователь авторизован */}
          {user && (
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm"
            >
              <span>🚪</span>
              <span>Шығу</span>
            </button>
          )}

          {/* Кнопка входа - если не авторизован */}
          {!user && (
            <Link href="/login">
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition flex items-center gap-2 text-sm">
                <span>🔑</span>
                <span>Кіру</span>
              </button>
            </Link>
          )}
        </div>
        
        {/* Отображение местоположения */}
        {userLocation && (
          <div className="mt-4 p-3 bg-white/10 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <div className="flex-1">
                <p className="text-xs text-emerald-100">Сіздің орналасқан жеріңіз</p>
                <p className="text-sm font-medium">
                  {userLocation.address.length > 50 
                    ? userLocation.address.substring(0, 50) + '...' 
                    : userLocation.address}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-gray-500">Жақын маңда тағам жоқ</p>
          </div>
        ) : (
          <>
            <h2 className="font-bold text-lg mb-4">🍔 Жақын маңдағы ұсыныстар ({suppliers.length})</h2>
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-lg">{supplier.business_name}</h3>
                  <p className="text-gray-500 text-sm">📍 {supplier.distance_km} км</p>
                  
                  {supplier.surprise_bags.map((bag) => (
                    <Link href={`/offers/${bag.id}`} key={bag.id}>
                      <div className="mt-3 bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition cursor-pointer">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{bag.name}</p>
                            <p className="text-emerald-600 font-bold">
                              {bag.discounted_price} ₸
                              {bag.original_price > bag.discounted_price && (
                                <span className="text-gray-400 line-through text-sm ml-2">
                                  {bag.original_price} ₸
                                </span>
                              )}
                            </p>
                          </div>
                          {bag.discount_percentage > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              -{bag.discount_percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}