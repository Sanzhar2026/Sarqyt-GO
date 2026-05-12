// components/BottomNav.tsx
'use client';

import { usePathname } from 'next/navigation';
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
}

export default function BottomNav({ lang = 'kz' }: BottomNavProps) {
  const pathname = usePathname();

  const getLabel = (item: NavItem) => {
    if (lang === 'kz') return item.labelKz;
    return item.labelRu;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg rounded-t-2xl max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || 
                          (item.href === '/' && pathname === '/');

          if (item.isCenter) {
            return (
              <Link href={item.href} key={index} className="flex flex-col items-center -mt-8">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  {/* Логотип в центре нижней навигации */}
                  <Logo size="small" showText={false} />
                </div>
              </Link>
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
    </div>
  );
}