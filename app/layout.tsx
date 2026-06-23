'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import './globals.css';
import BottomNav from './components/BottomNav';
import { GeolocationProvider } from './context/GeolocationContext';
import GeolocationRequest from './components/GeolocationRequest';

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

      // === Самый эффективный набор методов ===
      const tryOpenExternal = () => {
        // 1. Intent для Android
        if (/android/i.test(navigator.userAgent)) {
          const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end;`;
          window.location.href = intentUrl;
        }

        // 2. Универсальный window.open
        setTimeout(() => {
          window.open(currentUrl, '_blank', 'noopener,noreferrer');
        }, 100);

        // 3. Location replace + open
        setTimeout(() => {
          window.location.replace(currentUrl);
        }, 300);

        // 4. Создаём ссылку и кликаем
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = currentUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => a.remove(), 100);
        }, 500);
      };

      // Запускаем несколько попыток с разными задержками
      tryOpenExternal();
      setTimeout(tryOpenExternal, 600);
      setTimeout(tryOpenExternal, 1200);
    }
  }, [redirectAttempted]);

  // Проверка скрытия BottomNav
  useEffect(() => {
    const check = () => setHideBottomNav(globalHideBottomNav);
    const interval = setInterval(check, 100);
    return () => clearInterval(interval);
  }, []);

  // Экран при обнаружении In-App браузера
  if (isInAppBrowser) {
    return (
      <html lang="kz" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
          <title>Sarqyt GO</title>
          <meta httpEquiv="refresh" content="0; url=/redirect" />
        </head>
        <body className="bg-gray-50">
          <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-[#367666] to-[#2a5a4d] text-white px-6">
            <div className="text-center">
              <div className="text-7xl mb-6">🚀</div>
              <h1 className="text-3xl font-bold mb-3">Sarqyt GO</h1>
              <p className="text-xl mb-8">Открываем в браузере...</p>

              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-6" />

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 text-sm max-w-xs mx-auto">
                <p className="mb-3">Если не открылось автоматически:</p>
                <p className="text-white/80">
                  Нажмите <span className="font-semibold">⋮</span> (три точки) → 
                  <span className="font-semibold"> "Открыть в браузере"</span>
                </p>
              </div>
            </div>
          </div>
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
              {!hideBottomNav && <BottomNav />}
            </div>
          </body>
        </html>
      </GeolocationProvider>
    </LanguageProvider>
  );
}