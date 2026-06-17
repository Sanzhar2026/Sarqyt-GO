// app/context/GeolocationContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Location {
  lat: number;
  lon: number;
  city: string;
}

interface GeolocationContextType {
  location: Location | null;
  loading: boolean;
  error: string | null;
  refreshLocation: () => void;
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export function GeolocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    const savedLat = sessionStorage.getItem('user_lat');
    const savedLon = sessionStorage.getItem('user_lon');
    const savedCity = sessionStorage.getItem('user_city');
    
    if (savedLat && savedLon) {
      setLocation({
        lat: parseFloat(savedLat),
        lon: parseFloat(savedLon),
        city: savedCity || ''
      });
      setLoading(false);
      console.log(`📍 Используем сохраненные координаты: ${savedCity || ''}`);
      return;
    }

    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается браузером');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        sessionStorage.setItem('user_lat', String(lat));
        sessionStorage.setItem('user_lon', String(lon));
        
        let city = 'Не определен';
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
          );
          const data = await response.json();
          city = data.address?.city || data.address?.town || data.address?.village || 'Не определен';
          sessionStorage.setItem('user_city', city);
        } catch (err) {
          console.error('Ошибка определения города:', err);
        }
        
        setLocation({ lat, lon, city });
        setLoading(false);
        console.log(`📍 Текущее положение: ${city} (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
      },
      (err) => {
        console.error('Геолокация ошибка:', err);
        let errorMsg = 'Не удалось определить местоположение';
        if (err.code === 1) errorMsg = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
        if (err.code === 2) errorMsg = 'Позиция недоступна';
        if (err.code === 3) errorMsg = 'Таймаут геолокации';
        setError(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <GeolocationContext.Provider value={{ location, loading, error, refreshLocation: getLocation }}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
}