// app/layout.tsx
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import BottomNav from './components/BottomNav';
import { AuthProvider, useAuth } from './providers/AuthProvider';

type Language = 'kz' | 'ru';

// Language Context (как был)
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
  const [lang, setLang] = useState<Language>('ru');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'kz' || savedLang === 'ru') setLang(savedLang);
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

// Global state for BottomNav
let globalHideBottomNav = false;
export const setGlobalHideBottomNav = (value: boolean) => {
  globalHideBottomNav = value;
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setHideBottomNav(globalHideBottomNav), 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
        <meta name="theme-color" content="#059669" />
        <title>Sarqyn GO</title>
      </head>
      <body className="bg-gray-50">
        <LanguageProvider>
          <AuthProvider>
            <div className="max-w-md mx-auto relative min-h-screen">
              {children}
              {mounted && !hideBottomNav && <BottomNav />}
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}