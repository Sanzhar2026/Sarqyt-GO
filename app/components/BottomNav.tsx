// components/BottomNav.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../../app/layout';

interface NavItem {
  labelKz: string;
  labelRu: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { 
    labelKz: 'Басты', 
    labelRu: 'Главная', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ), 
    href: '/offers'
  },
  { 
    labelKz: 'Іздеу', 
    labelRu: 'Поиск', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ), 
    href: '/' 
  },
  { 
    labelKz: '', 
    labelRu: '', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ), 
    href: '/favorites' 
  },
  { 
    labelKz: 'Себет', 
    labelRu: 'Корзина', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
      </svg>
    ), 
    href: '/cart' 
  },
  { 
    labelKz: 'Профиль', 
    labelRu: 'Профиль', 
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ), 
    href: '/profile' 
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();

  const getLabel = (item: NavItem) => {
    return lang === 'kz' ? item.labelKz : item.labelRu;
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/offers') return pathname === '/offers' || pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-lg rounded-t-2xl max-w-md mx-auto">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item, index) => {
          const active = isActive(item.href);
          
          return (
            <Link 
              href={item.href} 
              key={index}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.href);
              }}
              className="flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 hover:bg-gray-50 group cursor-pointer"
            >
              <span className={`mb-1 transition-all duration-200 ${
                active ? 'text-[#367666]' : 'text-gray-400 group-hover:text-[#367666]'
              }`}>
                {item.icon}
              </span>
              {item.labelKz && (
                <span className={`text-xs font-medium transition-all duration-200 ${
                  active ? 'text-[#367666]' : 'text-gray-400 group-hover:text-[#367666]'
                }`}>
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