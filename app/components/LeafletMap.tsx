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

  useEffect(() => {
    if (!mapRef.current) {
      // Центр карты (Алматы по умолчанию)
      const centerLat = startLat || 43.238
      const centerLon = startLon || 76.945
      
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
  }, [])
  
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