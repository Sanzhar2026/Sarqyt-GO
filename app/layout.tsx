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

  useEffect(() => {
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    const interval = setInterval(checkHideStatus, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <LanguageProvider>
      <html lang="kz" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
          <title>Sarqyn Food</title>
        </head>
        <body className="bg-gray-50">
          <div className="max-w-md mx-auto relative min-h-screen">
            {children}
            {!hideBottomNav && <BottomNav />}
          </div>
        </body>
      </html>
    </LanguageProvider>
  );
}