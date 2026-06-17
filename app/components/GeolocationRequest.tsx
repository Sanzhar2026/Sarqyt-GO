// app/components/GeolocationRequest.tsx
'use client';

import { useState, useEffect } from 'react';

export default function GeolocationRequest() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем есть ли координаты
    const savedLat = sessionStorage.getItem('user_lat');
    const savedLon = sessionStorage.getItem('user_lon');
    
    if (savedLat && savedLon) {
      return; // Уже есть координаты
    }

    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается браузером');
      setShow(true);
      return;
    }

    // Пытаемся получить геолокацию
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        sessionStorage.setItem('user_lat', String(lat));
        sessionStorage.setItem('user_lon', String(lon));
        setShow(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (err.code === 1) {
          setError('Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.');
        } else if (err.code === 2) {
          setError('Позиция недоступна');
        } else if (err.code === 3) {
          setError('Таймаут геолокации');
        }
        setShow(true);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 mx-4">
      <div className="bg-white rounded-2xl shadow-xl border border-yellow-200 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-1">📍</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Нужен доступ к геолокации</p>
            <p className="text-sm text-gray-600 mt-1">{error || 'Для работы приложения необходимо ваше местоположение'}</p>
          </div>
          <button
            onClick={() => {
              // Запрашиваем снова
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    sessionStorage.setItem('user_lat', String(lat));
                    sessionStorage.setItem('user_lon', String(lon));
                    setShow(false);
                    window.location.reload();
                  },
                  () => {
                    setError('Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.');
                  },
                  { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
              }
            }}
            className="bg-[#367666] text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap hover:bg-[#2a5a4d] transition"
          >
            🔄 Попробовать
          </button>
        </div>
      </div>
    </div>
  );
}