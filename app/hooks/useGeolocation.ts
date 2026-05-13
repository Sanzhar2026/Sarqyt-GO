// hooks/useGeolocation.ts
'use client';

import { useState, useEffect } from 'react';

interface Location {
  lat: number | null;
  lon: number | null;
  city: string | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

// 🔽 ДОБАВЬТЕ ЭТУ ФУНКЦИЮ ДЛЯ ОПРЕДЕЛЕНИЯ ГОРОДА ПО КООРДИНАТАМ
const getCityByCoords = (lat: number, lon: number): string | null => {
  // Актобе (примерные границы)
  if (lat >= 50.2 && lat <= 50.4 && lon >= 57.1 && lon <= 57.3) {
    return 'Актобе';
  }
  // Алматы
  if (lat >= 43.2 && lat <= 43.3 && lon >= 76.8 && lon <= 77.0) {
    return 'Алматы';
  }
  // Астана
  if (lat >= 51.1 && lat <= 51.2 && lon >= 71.4 && lon <= 71.5) {
    return 'Астана';
  }
  // Шымкент
  if (lat >= 42.3 && lat <= 42.4 && lon >= 69.5 && lon <= 69.7) {
    return 'Шымкент';
  }
  // Караганда
  if (lat >= 49.8 && lat <= 49.9 && lon >= 73.0 && lon <= 73.2) {
    return 'Караганда';
  }
  return null;
};

export function useGeolocation() {
  const [location, setLocation] = useState<Location>({
    lat: null,
    lon: null,
    city: null,
    address: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: 'Геолокация не поддерживается' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        let city: string | null = null;
        let address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        
        // 🔽 СНАЧАЛА ПРОВЕРЯЕМ ПО КООРДИНАТАМ
        city = getCityByCoords(lat, lon);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
          );
          const data = await response.json();
          
          // Если API вернул город - используем его
          const apiCity = data.address?.city || data.address?.town || data.address?.village || null;
          if (apiCity) {
            city = apiCity;
          }
          
          if (data.display_name) {
            address = data.display_name;
          }
          
          console.log('📍 Геолокация:', { lat, lon, city, address });
          
        } catch (e) {
          console.error('Reverse geocoding error:', e);
        }
        
        setLocation({
          lat,
          lon,
          city: city || 'местоположение определено',
          address,
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocation({
          lat: null,
          lon: null,
          city: null,
          address: null,
          loading: false,
          error: 'Разрешите доступ к геолокации',
        });
      }
    );
  }, []);

  return location;
}