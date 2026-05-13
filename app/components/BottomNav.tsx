// components/BottomNav.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';

interface NavItem {
  labelKz: string;
  labelRu: string;
  icon: string;
  href: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { 
    labelKz: 'Ашу', 
    labelRu: 'Открыть',
    icon: '🔍', 
    href: '/offers'
  },
  { 
    labelKz: 'Шолу', 
    labelRu: 'Обзор',
    icon: '🔭', 
    href: '/'
  },
  { 
    labelKz: '', 
    labelRu: '',
    icon: '💚', 
    href: '/',
    isCenter: true 
  },
  { 
    labelKz: 'Себет', 
    labelRu: 'Корзина',
    icon: '🛒', 
    href: '/cart'
  },
  { 
    labelKz: 'Профиль', 
    labelRu: 'Профиль',
    icon: '👤', 
    href: '/profile'
  },
];

interface BottomNavProps {
  lang?: 'kz' | 'ru';
  onLanguageChange?: (lang: 'kz' | 'ru') => void;
}

export default function BottomNav({ lang = 'kz', onLanguageChange }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter(); // ← ADD useRouter

  const getLabel = (item: NavItem) => {
    if (lang === 'kz') return item.labelKz;
    return item.labelRu;
  };

  const handleNavigation = (href: string) => {
    router.push(href); // ← Use Next.js router for client-side navigation
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg rounded-t-2xl max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || 
                          (item.href === '/' && pathname === '/');

          if (item.isCenter) {
            return (
              <div key={index} className="flex flex-col items-center -mt-8">
                <div 
                  onClick={() => handleNavigation(item.href)} // ← FIXED
                  className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer"
                >
                  <Logo size="small" showText={false} />
                </div>
              </div>
            );
          }

          return (
            <Link 
              href={item.href} 
              key={index}
              className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                isActive ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{getLabel(item)}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Language Switcher at bottom */}
      <div className="flex justify-center gap-4 py-2 border-t border-gray-100">
        <button
          onClick={() => onLanguageChange?.('kz')}
          className={`text-xs font-medium py-2 px-3 rounded-full transition ${
            lang === 'kz' 
              ? 'bg-emerald-600 text-white' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Қазақша
        </button>
        <button
          onClick={() => onLanguageChange?.('ru')}
          className={`text-xs font-medium py-2 px-3 rounded-full transition ${
            lang === 'ru' 
              ? 'bg-emerald-600 text-white' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          Русский
        </button>
      </div>
    </div>
  );
}