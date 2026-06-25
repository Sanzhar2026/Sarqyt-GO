// app/layout.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

'use client';
import { WebSocketListener } from './components/WebSocketListener';
import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import BottomNav from './components/BottomNav';
import { GeolocationProvider } from './context/GeolocationContext';
import GeolocationRequest from './components/GeolocationRequest';
// app/layout.tsx

'use client';


import { LanguageProvider, useLanguage } from './components/LanguageSwitcher'

// Глобальное состояние для скрытия BottomNav
let globalHideBottomNav = false;
export const setGlobalHideBottomNav = (value: boolean) => {
  globalHideBottomNav = value;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideBottomNav, setHideBottomNav] = useState(false);

  useEffect(() => {
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    const interval = setInterval(checkHideStatus, 100);
    return () => clearInterval(interval);
  }, []);

  // Запрашиваем геолокацию
  useEffect(() => {
    const savedLat = sessionStorage.getItem('user_lat');
    const savedLon = sessionStorage.getItem('user_lon');
    
    if (savedLat && savedLon) {
      console.log('📍 Уже есть сохраненные координаты');
      return;
    }

    if (navigator.geolocation) {
      console.log('📍 Запрашиваем геолокацию...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          sessionStorage.setItem('user_lat', String(lat));
          sessionStorage.setItem('user_lon', String(lon));
          console.log(`📍 Геолокация получена: ${lat}, ${lon}`);
        },
        (error) => {
          console.warn('❌ Геолокация запрещена или недоступна:', error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn('❌ Геолокация не поддерживается браузером');
    }
  }, []);

  return (
    <LanguageProvider>  {/* ✅ ТОЛЬКО ОДИН LanguageProvider */}
      <GeolocationProvider>
        <html lang="ru" suppressHydrationWarning>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes, viewport-fit=cover" />
            <title>Sarqyt GO</title>
          </head>
          <body className="bg-gray-50">
            <div className="max-w-md mx-auto bg-white shadow-lg min-h-dvh flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              <WebSocketListener />
              <GeolocationRequest />
              {!hideBottomNav && <BottomNav />}
            </div>
          </body>
        </html>
      </GeolocationProvider>
    </LanguageProvider>
  );
}