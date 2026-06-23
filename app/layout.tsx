// app/layout.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

'use client';
import { WebSocketListener } from './components/WebSocketListener';
import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import BottomNav from './components/BottomNav';
import { GeolocationProvider } from './context/GeolocationContext';
import GeolocationRequest from './components/GeolocationRequest';

type Language = 'kz' | 'ru';

// ==================== КОНТЕКСТ ЯЗЫКА ====================
interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('kz');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'kz' || savedLang === 'ru')) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang: lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
// =======================================================

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
  const [hideBottomNav, setHideBottomNav] = useState(true);
  const [isInstagram, setIsInstagram] = useState(false);

  // ✅ Функция проверки Instagram браузера
  const checkInstagramBrowser = () => {
    if (typeof window === 'undefined') return false;
    
    const ua = navigator.userAgent.toLowerCase();
    return (
      ua.includes('instagram') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('whatsapp') ||
      ua.includes('messenger') ||
      (ua.includes('mobile') && !ua.includes('safari') && !ua.includes('chrome') && !ua.includes('firefox'))
    );
  };

  useEffect(() => {
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    const interval = setInterval(checkHideStatus, 50);
    return () => clearInterval(interval);
  }, []);

  // ✅ ЗАПРАШИВАЕМ ГЕОЛОКАЦИЮ ТОЛЬКО ДЛЯ НЕ-INSTAGRAM БРАУЗЕРОВ
  useEffect(() => {
    const isInstagramBrowser = checkInstagramBrowser();
    setIsInstagram(isInstagramBrowser);
    
    if (isInstagramBrowser) {
      console.log('📱 Instagram браузер — геолокация НЕ запрашивается');
      return; // ✅ ВЫХОДИМ, НЕ ЗАПРАШИВАЕМ ГЕОЛОКАЦИЮ
    }

    // Проверяем есть ли уже сохраненные координаты
    const savedLat = sessionStorage.getItem('user_lat');
    const savedLon = sessionStorage.getItem('user_lon');
    
    if (savedLat && savedLon) {
      console.log('📍 Уже есть сохраненные координаты');
      return;
    }

    // Если нет - запрашиваем (только для обычных браузеров)
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
    <LanguageProvider>
      <GeolocationProvider>
        <html lang="kz" suppressHydrationWarning>
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
              {/* ✅ Показываем GeolocationRequest только если НЕ Instagram */}
              {!isInstagram && <GeolocationRequest />}
              {!hideBottomNav && <BottomNav />}
            </div>
          </body>
        </html>
      </GeolocationProvider>
    </LanguageProvider>
  );
}