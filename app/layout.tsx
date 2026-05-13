// app/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import BottomNav from './components/BottomNav';
import Logo from './components/Logo';

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
        {/* Top Header with Logo - NO Link wrapper */}
     
        
        <div className="max-w-md mx-auto relative min-h-screen">
          {children}
          <BottomNav lang={lang} onLanguageChange={handleLanguageChange} />
        </div>
      </body>
    </html>
  );
}