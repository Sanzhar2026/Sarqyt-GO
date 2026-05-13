// hooks/useGeolocation.ts
'use client';

import { useState, useEffect } from 'react';

interface Location {
  lat: number | null;
  lon: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location>({
    lat: null,
    lon: null,
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
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setLocation({
          lat: null,
          lon: null,
          loading: false,
          error: error.message,
        });
      }
    );
  }, []);

  return location;
}