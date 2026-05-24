// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '../components/BottomNav';
import { LanguageProvider } from './providers';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Sarqyn GO - Доставка еды',
  description: 'Спасайте еду от выброса вместе с Sarqyn GO',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sarqyn GO',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: true,
  },
};

// Глобальная переменная для скрытия навбара
let hideBottomNav = false;

export const setGlobalHideBottomNav = (hide: boolean) => {
  hideBottomNav = hide;
};

export const useLanguage = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('language');
    if (stored === 'kz' || stored === 'ru') {
      return { lang: stored as 'kz' | 'ru', setLang: (lang: 'kz' | 'ru') => {
        localStorage.setItem('language', lang);
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } };
    }
  }
  return { 
    lang: 'ru' as 'kz' | 'ru', 
    setLang: (lang: 'kz' | 'ru') => {
      localStorage.setItem('language', lang);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } 
  };
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* ✅ МЕТА-ТЕГ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
        <meta name="theme-color" content="#059669" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
            </div>
          }>
            {children}
          </Suspense>
          {!hideBottomNav && <BottomNav />}
        </LanguageProvider>
      </body>
    </html>
  );
}