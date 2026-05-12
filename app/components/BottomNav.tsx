'use client'

import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { translations, type Language } from '../../lib/i18n'

const navItems = (t: any) => [
  { label: t.home, icon: Home, href: '/' },
  { label: t.discover, icon: Search, href: '/offers' },
  { label: t.favorites, icon: Heart, href: '/favorites' },
  { label: t.cart, icon: ShoppingCart, href: '/cart' },
  { label: t.profile, icon: User, href: '/profile' },
]

export default function BottomNav() {
  const pathname = usePathname()
  // Временно используем русский язык для навигации
  const t = translations.ru

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto">
      <div className="flex items-center justify-around py-2">
        {navItems(t).map(({ label, icon: Icon, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center py-1 px-3 text-xs transition-all ${
              pathname === href ? 'text-emerald-600 scale-110' : 'text-gray-500'
            }`}
          >
            <Icon size={26} strokeWidth={2.25} />
            <span className="mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}