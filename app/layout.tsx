// app/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import BottomNav from './components/BottomNav';

type Language = 'kz' | 'ru';

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
  const [lang, setLang] = useState<Language>('kz');
  const [hideBottomNav, setHideBottomNav] = useState(true); // ← изначально скрыт

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'kz' || savedLang === 'ru')) {
      setLang(savedLang);
    }
    
    // Функция для обновления состояния из глобальной переменной
    const checkHideStatus = () => {
      setHideBottomNav(globalHideBottomNav);
    };
    
    // Интервал для проверки (временное решение)
    const interval = setInterval(checkHideStatus, 50);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <title>Sarqyn Food</title>
      </head>
      <body className="bg-gray-50">
        <div className="max-w-md mx-auto relative min-h-screen">
          {children}
          {/* ✅ BottomNav скрыт до окончания splash screen */}
          {!hideBottomNav && <BottomNav lang={lang} onLanguageChange={handleLanguageChange} />}
        </div>
      </body>
    </html>
  );
}