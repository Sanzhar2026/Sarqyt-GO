// app/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import './globals.css';
import BottomNav from './components/BottomNav';

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

  return (
    <html lang={lang}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes" />
        <title>Sarqyn Food</title>
      </head>
      <body className="bg-gray-50">
        <div className="max-w-md mx-auto relative min-h-screen">
          {children}
          <BottomNav lang={lang} />
        </div>
      </body>
    </html>
  );
}