// app/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import './../globals.css';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';

type Language = 'kz' | 'ru';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Language>('kz');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'kz' || savedLang === 'ru')) {
      setLang(savedLang);
    }
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
        {/* Top Header with Logo */}
        <div className="bg-emerald-600 pt-6 pb-3 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <Logo size="medium" showText={true} />
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange('kz')}
                className={`px-3 py-1 rounded-full text-xs ${lang === 'kz' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'}`}
              >
                Қаз
              </button>
              <button
                onClick={() => handleLanguageChange('ru')}
                className={`px-3 py-1 rounded-full text-xs ${lang === 'ru' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white'}`}
              >
                Рус
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-md mx-auto relative min-h-screen">
          {children}
          <BottomNav lang={lang} onLanguageChange={handleLanguageChange} />
        </div>
      </body>
    </html>
  );
}