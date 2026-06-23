// app/layout.tsx - С ПРОВЕРКОЙ INSTAGRAM И АВТОМАТИЧЕСКИМ ПЕРЕХОДОМ

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
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    const interval = setInterval(checkHideStatus, 50);
    return () => clearInterval(interval);
  }, []);

  // ✅ ПРОВЕРКА INSTAGRAM И АВТОМАТИЧЕСКИЙ ПЕРЕХОД
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isRedirecting) return;
    
    const ua = navigator.userAgent.toLowerCase();
    const isInstagramBrowser = (
      ua.includes('instagram') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('whatsapp') ||
      ua.includes('messenger') ||
      (ua.includes('mobile') && !ua.includes('safari') && !ua.includes('chrome') && !ua.includes('firefox'))
    );
    
    if (isInstagramBrowser) {
      setIsRedirecting(true);
      console.log('📱 Instagram браузер обнаружен! Автоматический переход в браузер...');
      
      const currentUrl = window.location.href;
      
      setTimeout(() => {
        // Для Android - открываем в Chrome
        if (navigator.userAgent.includes('Android')) {
          const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end;`;
          window.location.href = intentUrl;
        } 
        // Для iOS - открываем в Safari
        else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
          const safariUrl = currentUrl.replace(/^https?:\/\//, '');
          window.location.href = `x-safari-${safariUrl}`;
          
          // Fallback через 2 секунды
          setTimeout(() => {
            window.open(currentUrl, '_blank');
          }, 2000);
        } 
        // Для других браузеров
        else {
          window.open(currentUrl, '_blank');
        }
      }, 300);
    }
  }, [isRedirecting]);

  // ✅ ЗАПРАШИВАЕМ ГЕОЛОКАЦИЮ (ТОЛЬКО ДЛЯ НЕ-INSTAGRAM)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isRedirecting) return;
    
    const ua = navigator.userAgent.toLowerCase();
    const isInstagramBrowser = (
      ua.includes('instagram') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('whatsapp') ||
      ua.includes('messenger') ||
      (ua.includes('mobile') && !ua.includes('safari') && !ua.includes('chrome') && !ua.includes('firefox'))
    );
    
    // Если Instagram - не запрашиваем геолокацию
    if (isInstagramBrowser) {
      console.log('📱 Instagram браузер — геолокация НЕ запрашивается');
      return;
    }

    // Проверяем есть ли уже сохраненные координаты
    const savedLat = sessionStorage.getItem('user_lat');
    const savedLon = sessionStorage.getItem('user_lon');
    
    if (savedLat && savedLon) {
      console.log('📍 Уже есть сохраненные координаты');
      return;
    }

    // Запрашиваем геолокацию (только для обычных браузеров)
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
  }, [isRedirecting]);

  // ✅ ПОКАЗЫВАЕМ ЗАГРУЗКУ ВО ВРЕМЯ ПЕРЕХОДА
  if (isRedirecting) {
    return (
      <html lang="kz" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes, viewport-fit=cover" />
          <title>Sarqyt GO</title>
        </head>
        <body className="bg-gray-50">
          <div className="min-h-dvh flex flex-col items-center justify-center bg-[#367666]">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-2xl font-bold mb-2">Sarqyt GO</h1>
              <p className="text-white/80">Открываем в браузере...</p>
              <div className="mt-4 w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </body>
      </html>
    );
  }

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
              <GeolocationRequest />
              {!hideBottomNav && <BottomNav />}
            </div>
          </body>
        </html>
      </GeolocationProvider>
    </LanguageProvider>
  );
}