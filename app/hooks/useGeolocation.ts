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
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // ✅ NO API CALLS - just use coordinates
        const address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        
        // ✅ Simple city detection by coordinates (no external API)
        let city = 'местоположение определено';
        
        // Aktobe
        if (lat >= 50.2 && lat <= 50.4 && lon >= 57.1 && lon <= 57.3) {
          city = 'Актобе';
        }
        // Almaty
        else if (lat >= 43.2 && lat <= 43.3 && lon >= 76.8 && lon <= 77.0) {
          city = 'Алматы';
        }
        // Astana
        else if (lat >= 51.1 && lat <= 51.2 && lon >= 71.4 && lon <= 71.5) {
          city = 'Астана';
        }
        // Shymkent
        else if (lat >= 42.3 && lat <= 42.4 && lon >= 69.5 && lon <= 69.7) {
          city = 'Шымкент';
        }
        // Karaganda
        else if (lat >= 49.8 && lat <= 49.9 && lon >= 73.0 && lon <= 73.2) {
          city = 'Караганда';
        }
        
        setLocation({
          lat,
          lon,
          city,
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