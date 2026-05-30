// app/hooks/useGeolocation.ts - исправленный хук

'use client';

import { useState, useEffect } from 'react';

interface Location {
  lat: number;
  lon: number;
  city: string;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location>({
    lat: 0,
    lon: 0,
    city: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Геолокация не поддерживается браузером'
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Получаем город по координатам
        let city = '';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
          );
          const data = await response.json();
          city = data.address?.city || data.address?.town || data.address?.village || 'Не определен';
        } catch (error) {
          console.error('Ошибка определения города:', error);
        }
        
        setLocation({
          lat,
          lon,
          city,
          loading: false,
          error: null
        });
        
        console.log(`📍 Текущее положение: ${city} (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      },
      (error) => {
        console.error('Ошибка геолокации:', error);
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: 'Не удалось определить местоположение'
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  return location;
}