// app/layout.tsx
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import BottomNav from './components/BottomNav';

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
  const [lang, setLang] = useState<Language>('ru');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'kz' || savedLang === 'ru') {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
// =======================================================

// ==================== ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ====================
let globalHideBottomNav = false;
export const setGlobalHideBottomNav = (value: boolean) => {
  globalHideBottomNav = value;
};
// =======================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Проверка скрытия навбара
    const interval = setInterval(() => {
      setHideBottomNav(globalHideBottomNav);
    }, 50);
    
    // Определяем мобильное устройство
    const userAgent = navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(mobile);
    
    // ✅ ПРИНУДИТЕЛЬНОЕ СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ДЛЯ МОБИЛЬНЫХ
    const ensureUser = () => {
      let user = localStorage.getItem('user');
      if (!user) {
        // Создаем тестового пользователя
        const testUser = {
          id: Date.now(),
          name: mobile ? 'Mobile User' : 'Test User',
          phone: '+77777777777',
          is_mobile: mobile,
          created_at: new Date().toISOString()
        };
        localStorage.setItem('user', JSON.stringify(testUser));
        localStorage.setItem('user_id', String(testUser.id));
        console.log('✅ Создан пользователь для устройства:', mobile ? 'Мобильное' : 'Десктоп');
      }
    };
    
    ensureUser();
    
    // Для отладки - выводим информацию в консоль
    console.log('📱 Устройство:', mobile ? 'Мобильное' : 'Десктоп');
    console.log('👤 Пользователь:', localStorage.getItem('user'));
    
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <html lang="ru">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
          <title>Sarqyn GO</title>
        </head>
        <body className="bg-gray-50">
          <div className="max-w-md mx-auto relative min-h-screen flex items-center justify-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <title>Sarqyn GO - Доставка еды</title>
      </head>
      <body className="bg-gray-50">
        <LanguageProvider>
          <div className="max-w-md mx-auto relative min-h-screen">
            {children}
            {!hideBottomNav && <BottomNav />}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}