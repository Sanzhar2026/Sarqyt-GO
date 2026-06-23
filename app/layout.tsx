// app/layout.tsx - УЛУЧШЕННАЯ ВЕРСИЯ С АВТОМАТИЧЕСКИМ ОТКРЫТИЕМ

'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import './globals.css';
import BottomNav from './components/BottomNav';
import { GeolocationProvider } from './context/GeolocationContext';
import GeolocationRequest from './components/GeolocationRequest';
import { WebSocketListener } from './components/WebSocketListener';

type Language = 'kz' | 'ru';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Language>('kz');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Глобальное состояние для BottomNav
let globalHideBottomNav = false;
export const setGlobalHideBottomNav = (value: boolean) => { globalHideBottomNav = value; };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [hideBottomNav, setHideBottomNav] = useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [showManualPrompt, setShowManualPrompt] = useState(false);

  // Проверка на In-App браузеры
  useEffect(() => {
    if (typeof window === 'undefined' || redirectAttempted) return;

    const ua = navigator.userAgent.toLowerCase();
    const inApp = 
      ua.includes('instagram') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('whatsapp') ||
      ua.includes('messenger') ||
      ua.includes('line') ||
      (ua.includes('mobile') && !ua.includes('safari') && !ua.includes('chrome') && !ua.includes('firefox') && !ua.includes('edge'));

    setIsInAppBrowser(inApp);

    if (inApp) {
      setRedirectAttempted(true);
      console.log('🔄 In-App Browser detected. Trying to open in external browser...');

      const currentUrl = window.location.href;

      // === МЕТОД 1: Intent для Android ===
      if (/android/i.test(navigator.userAgent)) {
        const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end;`;
        setTimeout(() => {
          window.location.href = intentUrl;
        }, 100);
      }

      // === МЕТОД 2: Safari для iOS ===
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        const safariUrl = currentUrl.replace(/^https?:\/\//, '');
        setTimeout(() => {
          window.location.href = `x-safari-${safariUrl}`;
        }, 100);
      }

      // === МЕТОД 3: window.open ===
      setTimeout(() => {
        window.open(currentUrl, '_blank', 'noopener,noreferrer');
      }, 200);

      // === МЕТОД 4: location.replace ===
      setTimeout(() => {
        window.location.replace(currentUrl);
      }, 300);

      // === МЕТОД 5: Создаём ссылку и кликаем ===
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = currentUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 100);
      }, 400);

      // === МЕТОД 6: Meta refresh ===
      setTimeout(() => {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'refresh';
        meta.content = `0; url=${currentUrl}`;
        document.head.appendChild(meta);
      }, 500);

      // === МЕТОД 7: Beforeunload (агрессивный) ===
      setTimeout(() => {
        window.onbeforeunload = function() {
          window.open(currentUrl, '_blank');
        };
        window.location.reload();
      }, 600);

      // === ПОКАЗЫВАЕМ РУЧНУЮ ИНСТРУКЦИЮ ЧЕРЕЗ 3 СЕКУНДЫ ===
      setTimeout(() => {
        setShowManualPrompt(true);
      }, 3000);
    }
  }, [redirectAttempted]);

  // Проверка скрытия BottomNav
  useEffect(() => {
    const check = () => setHideBottomNav(globalHideBottomNav);
    const interval = setInterval(check, 100);
    return () => clearInterval(interval);
  }, []);

  // ✅ ГЕОЛОКАЦИЯ ТОЛЬКО ДЛЯ НЕ-INSTAGRAM
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInAppBrowser) return;

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
  }, [isInAppBrowser]);

  // Экран при обнаружении In-App браузера
  if (isInAppBrowser) {
    return (
      <html lang="kz" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
          <title>Sarqyt GO</title>
        </head>
        <body className="bg-gray-50">
          <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-[#367666] to-[#2a5a4d] text-white px-6">
            <div className="text-center max-w-md">
              <div className="text-7xl mb-6">🚀</div>
              <h1 className="text-3xl font-bold mb-3">Sarqyt GO</h1>
              <p className="text-xl mb-8">Открываем в браузере...</p>

              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-8" />

              {/* Ручная инструкция (появляется через 3 секунды) */}
              {showManualPrompt && (
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 text-sm max-w-xs mx-auto animate-fadeIn">
                  <p className="mb-3 font-medium">Если не открылось автоматически:</p>
                  <div className="space-y-3 text-white/90">
                    <div className="flex items-center gap-3 justify-center">
                      <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                      <span>Нажмите <span className="font-bold text-yellow-300">⋮</span> (три точки)</span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                      <span>Выберите <span className="font-bold text-yellow-300">"Открыть в браузере"</span></span>
                    </div>
                    <div className="flex items-center gap-3 justify-center">
                      <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
                      <span>Или скопируйте ссылку ниже</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const currentUrl = window.location.href;
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(currentUrl).then(() => {
                          alert('✅ Ссылка скопирована! Вставьте её в браузере.');
                        });
                      } else {
                        prompt('Скопируйте ссылку:', currentUrl);
                      }
                    }}
                    className="mt-4 w-full bg-white text-[#367666] py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
                  >
                    📋 Скопировать ссылку
                  </button>
                </div>
              )}

              <p className="text-white/50 text-xs mt-8">
                Автоматическое открытие через несколько секунд...
              </p>
            </div>
          </div>

          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
              animation: fadeIn 0.5s ease-out;
            }
          `}</style>
        </body>
      </html>
    );
  }

  // Основной рендер
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