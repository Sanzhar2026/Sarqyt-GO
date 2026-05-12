// hooks/useGeolocation.ts
import { useState, useEffect } from 'react'

interface Location {
  lat: number | null
  lon: number | null
  address: string | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location>({
    lat: null,
    lon: null,
    address: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: 'Геолокация не поддерживается' }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        
        let address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
          )
          const data = await response.json()
          if (data.display_name) {
            address = data.display_name.split(',')[0]
          }
        } catch (e) {
          console.error('Reverse geocoding error:', e)
        }
        
        setLocation({
          lat,
          lon,
          address,
          loading: false,
          error: null,
        })
      },
      (error) => {
        setLocation({
          lat: null,
          lon: null,
          address: null,
          loading: false,
          error: error.message,
        })
      }
    )
  }, [])

  return location
}