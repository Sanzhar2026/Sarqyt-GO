// components/BottomNav.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../app/layout';

interface NavItem {
  labelKz: string;
  labelRu: string;
  icon: string;
  activeIcon?: string;
  href: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { 
    labelKz: 'Басты', 
    labelRu: 'Главная',
    icon: '🏠', 
    activeIcon: '🏠',
    href: '/'
  },
  { 
    labelKz: 'Іздеу', 
    labelRu: 'Поиск',
    icon: '🔍', 
    activeIcon: '🔍',
    href: '/search'
  },
  { 
    labelKz: '', 
    labelRu: '',
    icon: '💚', 
    activeIcon: '❤️',
    href: '/',
    isCenter: true 
  },
  { 
    labelKz: 'Себет', 
    labelRu: 'Корзина',
    icon: '🛒', 
    activeIcon: '🛒',
    href: '/cart'
  },
  { 
    labelKz: 'Профиль', 
    labelRu: 'Профиль',
    icon: '👤', 
    activeIcon: '👤',
    href: '/profile'
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();

  const getLabel = (item: NavItem) => {
    if (item.isCenter) return '';
    return lang === 'kz' ? item.labelKz : item.labelRu;
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg rounded-t-2xl max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item, index) => {
          const active = isActive(item.href);

          if (item.isCenter) {
            return (
              <div key={index} className="flex flex-col items-center -mt-8">
                <div 
                  onClick={() => handleNavigation(item.href)}
                  className="w-16 h-16 bg-brand rounded-full flex items-center justify-center shadow-xl border-4 border-white cursor-pointer active:scale-95 transition-transform duration-200"
                >
                  <span className="text-3xl">{item.icon}</span>
                </div>
              </div>
            );
          }

          return (
            <Link 
              href={item.href} 
              key={index}
              className="flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 group"
            >
              {/* Иконка - серая в неактивном, зеленая в активном */}
              <span className={`text-2xl mb-1 transition-colors duration-200 ${
                active ? 'text-brand' : 'text-gray-400 group-hover:text-brand/70'
              }`}>
                {active ? (item.activeIcon || item.icon) : item.icon}
              </span>
              
              {/* Текст - серый в неактивном, зеленый в активном */}
              <span className={`text-xs font-medium transition-colors duration-200 ${
                active ? 'text-brand font-semibold' : 'text-gray-400 group-hover:text-brand/70'
              }`}>
                {getLabel(item)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}