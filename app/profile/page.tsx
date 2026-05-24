// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../layout';

export default function ProfilePage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    kz: {
      profile: 'Профиль',
      welcome: 'Қош келдіңіз',
      login: 'Кіру',
      register: 'Тіркелу',
      myOrders: 'Менің тапсырыстарым',
      phone: 'Телефон',
      logout: 'Шығу',
      courierPanel: 'Курьер панелі'
    },
    ru: {
      profile: 'Профиль',
      welcome: 'Добро пожаловать',
      login: 'Войти',
      register: 'Регистрация',
      myOrders: 'Мои заказы',
      phone: 'Телефон',
      logout: 'Выйти',
      courierPanel: 'Панель курьера'
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser({
            id: parsed.id,
            full_name: parsed.full_name || parsed.name,
            phone: parsed.phone
          });
          setLoading(false);
        } catch(e) {}
      } else {
        setLoading(false);
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`https://toogood-2ncf.onrender.com/api/check-auth`, { 
          credentials: 'include', method: 'GET', headers: { 'Content-Type': 'application/json' }, signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const userData = { id: data.user_id, full_name: data.user_name, phone: data.user_phone || '' };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify({ id: userData.id, name: userData.full_name, phone: userData.phone }));
          }
        }
      } catch (err) {
        console.log('Фоновый запрос не удался');
      }
    };
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await fetch(`https://toogood-2ncf.onrender.com/logout`, { method: 'GET', credentials: 'include' });
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    setUser(null);
    window.location.href = '/';
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
      {/* Header с кнопками языка */}
      <div className="bg-emerald-600 text-white pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">{t[lang].profile}</h1>
          
          {/* Кнопки языка */}
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'kz' 
                  ? 'bg-white text-emerald-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'ru' 
                  ? 'bg-white text-emerald-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
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
              {isLoggedIn ? (user?.full_name || user?.phone) : t[lang].welcome}
            </h2>
            <p className="text-emerald-100 text-sm">
              {isLoggedIn ? user?.phone : t[lang].login}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {!isLoggedIn ? (
          <>
            <Link href="/login"><div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition"><span className="flex items-center gap-3"><span className="text-2xl">🔑</span><span className="font-medium">{t[lang].login}</span></span><span className="text-gray-400">→</span></div></Link>
            <Link href="/signup"><div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition"><span className="flex items-center gap-3"><span className="text-2xl">📝</span><span className="font-medium">{t[lang].register}</span></span><span className="text-gray-400">→</span></div></Link>
          </>
        ) : (
          <>
            <Link href="/orders"><div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition"><span className="flex items-center gap-3"><span className="text-2xl">📦</span><span className="font-medium">{t[lang].myOrders}</span></span><span className="text-gray-400">→</span></div></Link>
            <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm"><span className="flex items-center gap-3"><span className="text-2xl">📞</span><span className="font-medium">{t[lang].phone}</span></span><span className="text-gray-500 text-sm">{user?.phone}</span></div>
            <button onClick={handleLogout} className="w-full bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:bg-red-50 transition text-red-600"><span className="flex items-center gap-3"><span className="text-2xl">🚪</span><span className="font-medium">{t[lang].logout}</span></span><span className="text-red-400">→</span></button>
            <Link href="/courier/dashboard">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition">
                <span className="flex items-center gap-3"><span className="text-2xl">🚚</span><span className="font-medium">{t[lang].courierPanel}</span></span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}