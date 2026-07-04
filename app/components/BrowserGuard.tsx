// app/components/BrowserGuard.tsx - СРАЗУ ПЕРЕНАПРАВЛЯЕТ

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface BrowserGuardProps {
  children: React.ReactNode;
}

export default function BrowserGuard({ children }: BrowserGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ✅ НЕ ПРОВЕРЯЕМ НА СТРАНИЦЕ /browser-check
    if (pathname === '/browser-check') {
      return;
    }

    const ua = navigator.userAgent || '';
    const isInstagram = ua.includes('Instagram') || 
                        ua.includes('FBAN') || 
                        ua.includes('FBAV');

    // ✅ ПРОВЕРЯЕМ КЭШ ГЕОЛОКАЦИИ
    const cachedLocation = localStorage.getItem('userLocation');
    
    // ✅ ЕСЛИ INSTAGRAM И НЕТ КЭША - СРАЗУ ПЕРЕНАПРАВЛЯЕМ
    if (isInstagram && !cachedLocation) {
      console.log('📱 Instagram браузер, перенаправление...');
      router.replace('/browser-check'); // replace вместо push
    }
  }, [pathname, router]);

  // ✅ ЕСЛИ ЭТО СТРАНИЦА /browser-check - ПОКАЗЫВАЕМ ЕЁ
  if (pathname === '/browser-check') {
    return <>{children}</>;
  }

  // ✅ ЕСЛИ INSTAGRAM И НЕТ КЭША - НЕ ПОКАЗЫВАЕМ КОНТЕНТ
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isInstagram = ua.includes('Instagram') || 
                      ua.includes('FBAN') || 
                      ua.includes('FBAV');
  const cachedLocation = typeof localStorage !== 'undefined' ? localStorage.getItem('userLocation') : null;

  if (isInstagram && !cachedLocation) {
    return null; // Показываем пустоту, пока идет редирект
  }

  return <>{children}</>;
}