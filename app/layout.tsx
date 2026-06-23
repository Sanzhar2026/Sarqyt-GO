// app/layout.tsx - ПРОСТОЙ БАННЕР ДЛЯ INSTAGRAM

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

  useEffect(() => {
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    const interval = setInterval(checkHideStatus, 50);
    return () => clearInterval(interval);
  }, []);

  // ✅ ПРОВЕРКА INSTAGRAM
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
    
    if (isInstagramBrowser) {
      console.log('📱 Instagram браузер обнаружен!');
    }
  }, []);

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

  return (
    <LanguageProvider>
      <GeolocationProvider>
        <html lang="kz" suppressHydrationWarning>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes, viewport-fit=cover" />
            <title>Sarqyt GO</title>
          </head>
          <body className="bg-gray-50">
            <div className="max-w-md mx-auto bg-white shadow-lg min-h-dvh flex flex-col relative">
              {/* БАННЕР ДЛЯ INSTAGRAM */}
              {isInstagram && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
                    <div className="text-center">
                      <div className="text-5xl mb-4">📱</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Откройте в браузере
                      </h2>
                      <p className="text-gray-500 text-sm mb-6">
                        Приложение Sarqyt GO лучше работает в обычном браузере.<br />
                        Нажмите кнопку ниже, чтобы продолжить.
                      </p>
                      
                      <button
                        onClick={() => {
                          const currentUrl = window.location.href;
                          
                          // Пытаемся открыть
                          if (navigator.userAgent.includes('Android')) {
                            const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end;`;
                            window.open(intentUrl, '_blank');
                          } else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
                            const safariUrl = currentUrl.replace(/^https?:\/\//, '');
                            window.open(`x-safari-${safariUrl}`, '_blank');
                          } else {
                            window.open(currentUrl, '_blank');
                          }
                          
                          // Копируем ссылку
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(currentUrl);
                          }
                        }}
                        className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#2a5a4d] transition shadow-lg shadow-[#367666]/30"
                      >
                        Открыть в браузере
                      </button>
                      
                      <button
                        onClick={() => {
                          const currentUrl = window.location.href;
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(currentUrl).then(() => {
                              alert('✅ Ссылка скопирована! Откройте браузер и вставьте её.');
                            });
                          }
                        }}
                        className="w-full mt-3 text-gray-500 py-3 rounded-2xl text-sm hover:bg-gray-50 transition border border-gray-200"
                      >
                        📋 Скопировать ссылку
                      </button>
                      
                      <p className="text-xs text-gray-400 mt-4">
                        Или нажмите три точки в правом верхнем углу и выберите "Открыть в браузере"
                      </p>
                    </div>
                  </div>
                </div>
              )}

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