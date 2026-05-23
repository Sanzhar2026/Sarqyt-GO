'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Исправление маркеров Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface LeafletMapProps {
  startLat?: number
  startLon?: number
  endLat?: number
  endLon?: number
  onLocationFound?: (lat: number, lon: number) => void
}

export default function LeafletMap({ startLat, startLon, endLat, endLon, onLocationFound }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [userLocation, setUserLocation] = useState<{lat: number; lon: number} | null>(null)

  // Получаем реальное местоположение пользователя
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lon: longitude })
          if (onLocationFound) {
            onLocationFound(latitude, longitude)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }, [onLocationFound])

  useEffect(() => {
    if (!mapRef.current && (userLocation || startLat)) {
      // ✅ Используем реальные координаты, а не Алматы
      const centerLat = startLat || userLocation?.lat || 0
      const centerLon = startLon || userLocation?.lon || 0
      
      if (centerLat === 0 && centerLon === 0) {
        console.warn('Нет координат для отображения карты')
        return
      }
      
      mapRef.current = L.map('map').setView([centerLat, centerLon], 13)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      }).addTo(mapRef.current)
    }
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [userLocation, startLat, startLon])
  
  useEffect(() => {
    if (mapRef.current && startLat && startLon) {
      // Добавляем маркер старта
      const marker = L.marker([startLat, startLon]).addTo(mapRef.current)
      marker.bindPopup('🏪 Ресторан').openPopup()
      
      if (endLat && endLon) {
        L.marker([endLat, endLon]).addTo(mapRef.current).bindPopup('🏠 Клиент')
        
        // Рисуем линию
        L.polyline([[startLat, startLon], [endLat, endLon]], {
          color: '#fbbf24',
          weight: 4,
          dashArray: '8,8'
        }).addTo(mapRef.current)
      }
      
      mapRef.current.setView([startLat, startLon], 14)
    }
  }, [startLat, startLon, endLat, endLon])
  
  return <div id="map" className="w-full h-64 rounded-xl" />
}