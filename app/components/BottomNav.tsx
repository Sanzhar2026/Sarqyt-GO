// components/BottomNav.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../app/layout';

interface NavItem {
  labelKz: string;
  labelRu: string;
  icon: string;
  href: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { labelKz: 'Басты', labelRu: 'Главная', icon: '🏠', href: '/' },
  { labelKz: 'Іздеу', labelRu: 'Поиск', icon: '🔍', href: '/search' },
  { labelKz: '', labelRu: '', icon: '💚', href: '/', isCenter: true },
  { labelKz: 'Себет', labelRu: 'Корзина', icon: '🛒', href: '/cart' },
  { labelKz: 'Профиль', labelRu: 'Профиль', icon: '👤', href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();

  const getLabel = (item: NavItem) => {
    if (item.isCenter) return '';
    return lang === 'kz' ? item.labelKz : item.labelRu;
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg rounded-t-2xl max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item, index) => {
          return (
            <Link 
              href={item.href} 
              key={index}
              className="flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-200 hover:bg-gray-50 group"
            >
              <span className="text-2xl mb-1 text-gray-400 transition-colors duration-200">
                {item.icon}
              </span>
              {!item.isCenter && (
                <span className="text-xs font-medium text-gray-400 transition-colors duration-200">
                  {getLabel(item)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}