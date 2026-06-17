// app/hooks/useGeolocation.ts - УЛУЧШЕННАЯ ВЕРСИЯ С КЭШИРОВАНИЕМ

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
    // ✅ Сначала проверяем sessionStorage
    const savedLat = sessionStorage.getItem('user_lat');
    const savedLon = sessionStorage.getItem('user_lon');
    const savedCity = sessionStorage.getItem('user_city');
    
    if (savedLat && savedLon) {
      setLocation({
        lat: parseFloat(savedLat),
        lon: parseFloat(savedLon),
        city: savedCity || '',
        loading: false,
        error: null
      });
      console.log(`📍 Используем сохраненные координаты: ${savedCity || ''} (${savedLat}, ${savedLon})`);
      return;
    }

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
        
        // Сохраняем в sessionStorage
        sessionStorage.setItem('user_lat', String(lat));
        sessionStorage.setItem('user_lon', String(lon));
        
        // Получаем город по координатам
        let city = '';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
          );
          const data = await response.json();
          city = data.address?.city || data.address?.town || data.address?.village || 'Не определен';
          sessionStorage.setItem('user_city', city);
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
        
        // ✅ Если ошибка, но есть сохраненные координаты - используем их
        const savedLat = sessionStorage.getItem('user_lat');
        const savedLon = sessionStorage.getItem('user_lon');
        const savedCity = sessionStorage.getItem('user_city');
        
        if (savedLat && savedLon) {
          setLocation({
            lat: parseFloat(savedLat),
            lon: parseFloat(savedLon),
            city: savedCity || '',
            loading: false,
            error: 'Используются сохраненные координаты'
          });
          console.log(`📍 Используем сохраненные координаты: ${savedCity || ''}`);
          return;
        }
        
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: 'Не удалось определить местоположение. Пожалуйста, разрешите доступ к геолокации.'
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