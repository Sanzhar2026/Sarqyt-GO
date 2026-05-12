'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, type Language } from '@/lib/i18n';

interface User {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('kz');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/check-auth', { 
          credentials: 'include' 
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            // Get full user info
            const userRes = await fetch(`http://localhost:8000/api/users/${data.user_id}`, {
              credentials: 'include'
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              setUser(userData);
            } else {
              setUser({ id: data.user_id, full_name: data.user_name, phone: '' });
            }
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8000/logout', { 
        method: 'GET', 
        credentials: 'include' 
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">{t.profile}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1 rounded-full text-sm ${lang === 'kz' ? 'bg-white text-emerald-600' : 'bg-white/20'}`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded-full text-sm ${lang === 'ru' ? 'bg-white text-emerald-600' : 'bg-white/20'}`}
            >
              Рус
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl">
            {isLoggedIn ? '👤' : '👋'}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {isLoggedIn ? user?.full_name || user?.phone : t.welcome}
            </h2>
            <p className="text-emerald-100 text-sm">
              {isLoggedIn ? user?.phone : t.login}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-6 space-y-3">
        {!isLoggedIn ? (
          <>
            <Link href="/login">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition">
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🔑</span>
                  <span className="font-medium">{t.login}</span>
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            <Link href="/signup">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition">
                <span className="flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <span className="font-medium">{t.register}</span>
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link href="/my-orders">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition">
                <span className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <span className="font-medium">{t.myOrders}</span>
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            <Link href="/favorites">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition">
                <span className="flex items-center gap-3">
                  <span className="text-2xl">❤️</span>
                  <span className="font-medium">{t.favorites}</span>
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-3">
                <span className="text-2xl">📞</span>
                <span className="font-medium">{t.phone}</span>
              </span>
              <span className="text-gray-500 text-sm">{user?.phone}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-3">
                <span className="text-2xl">🌍</span>
                <span className="font-medium">{t.language}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLang('kz')}
                  className={`px-3 py-1 rounded-full text-sm ${lang === 'kz' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                >
                  Қаз
                </button>
                <button
                  onClick={() => setLang('ru')}
                  className={`px-3 py-1 rounded-full text-sm ${lang === 'ru' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}
                >
                  Рус
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:bg-red-50 transition text-red-600"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl">🚪</span>
                <span className="font-medium">{t.logout}</span>
              </span>
              <span className="text-red-400">→</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}