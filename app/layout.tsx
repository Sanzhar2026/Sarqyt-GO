// app/layout.tsx - МАКСИМАЛЬНО АВТОМАТИЧЕСКОЕ ОТКРЫТИЕ

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
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    const interval = setInterval(checkHideStatus, 50);
    return () => clearInterval(interval);
  }, []);

  // ✅ ПРОВЕРКА INSTAGRAM И МАКСИМАЛЬНО АВТОМАТИЧЕСКОЕ ОТКРЫТИЕ
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (redirectAttempted) return;
    
    const ua = navigator.userAgent.toLowerCase();
    const isInstagramBrowser = (
      ua.includes('instagram') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('whatsapp') ||
      ua.includes('messenger') ||
      (ua.includes('mobile') && !ua.includes('safari') && !ua.includes('chrome') && !ua.includes('firefox'))
    );
    
    setIsInstagram(isInstagramBrowser);
    
    if (isInstagramBrowser && !redirectAttempted) {
      setRedirectAttempted(true);
      console.log('📱 Instagram браузер обнаружен! Пытаемся открыть в браузере...');
      
      const currentUrl = window.location.href;
      
      // СПОСОБ 1: Через setTimeout с задержкой
      setTimeout(() => {
        // Для Android
        if (navigator.userAgent.includes('Android')) {
          // Пробуем Chrome
          const chromeIntent = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end;`;
          window.location.href = chromeIntent;
          
          // Если не сработало - пробуем через 1 секунду другой способ
          setTimeout(() => {
            // Пробуем через window.open
            window.open(currentUrl, '_blank');
            
            // Пробуем через Web Intent
            const webIntent = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;end;`;
            window.location.href = webIntent;
          }, 1000);
        } 
        // Для iOS
        else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
          // Пробуем Safari
          const safariUrl = currentUrl.replace(/^https?:\/\//, '');
          window.location.href = `x-safari-${safariUrl}`;
          
          // Fallback через 1 секунду
          setTimeout(() => {
            window.open(currentUrl, '_blank');
            // Пробуем другой способ
            window.location.href = `https://${safariUrl}`;
          }, 1000);
        } 
        // Для других
        else {
          window.open(currentUrl, '_blank');
        }
      }, 100);

      // СПОСОБ 2: Через iframe (работает в некоторых случаях)
      setTimeout(() => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = currentUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          iframe.remove();
        }, 5000);
      }, 500);

      // СПОСОБ 3: Через meta refresh
      setTimeout(() => {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'refresh';
        meta.content = `0; url=${currentUrl}`;
        document.head.appendChild(meta);
      }, 200);

      // СПОСОБ 4: Через location.replace
      setTimeout(() => {
        window.location.replace(currentUrl);
      }, 300);

      // СПОСОБ 5: Через a клик
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = currentUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => link.remove(), 100);
      }, 400);
    }
  }, [redirectAttempted]);

  // ✅ ГЕОЛОКАЦИЯ ТОЛЬКО ДЛЯ НЕ-INSTAGRAM
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInstagram) return;

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
  }, [isInstagram]);

  // ✅ ПОКАЗЫВАЕМ ЭКРАН ВО ВРЕМЯ ПЕРЕХОДА
  if (isInstagram) {
    return (
      <html lang="kz" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes, viewport-fit=cover" />
          <title>Sarqyt GO</title>
          {/* Meta refresh как дополнительный способ */}
          <meta httpEquiv="refresh" content="0; url=/redirect" />
        </head>
        <body className="bg-gray-50">
          <div className="min-h-dvh flex flex-col items-center justify-center bg-[#367666]">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-2xl font-bold mb-2">Sarqyt GO</h1>
              <p className="text-white/80">Открываем в браузере...</p>
              <div className="mt-4 w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-white/50 text-xs mt-4">
                Если не открывается, нажмите три точки в правом верхнем углу<br />
                и выберите "Открыть в браузере"
              </p>
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