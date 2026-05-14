// components/BottomNav.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../../app/layout';

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

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang } = useLanguage();

  const getLabel = (item: NavItem) => {
    return lang === 'kz' ? item.labelKz : item.labelRu;
  };

  const handleNavigation = (href: string) => {
    router.push(href);
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
                  onClick={() => handleNavigation(item.href)}
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
      
      {/* Language Switcher - уменьшенный */}
      <div className="flex justify-center gap-2 py-1.5 border-t border-gray-100">
        <button
          onClick={() => setLang('kz')}
          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition ${
            lang === 'kz' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Қаз
        </button>
        <button
          onClick={() => setLang('ru')}
          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition ${
            lang === 'ru' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Рус
        </button>
      </div>
    </div>
  );
}