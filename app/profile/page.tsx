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
      courierPanel: 'Курьер панелі',
      language: 'Тіл'
    },
    ru: {
      profile: 'Профиль',
      welcome: 'Добро пожаловать',
      login: 'Войти',
      register: 'Регистрация',
      myOrders: 'Мои заказы',
      courierPanel: 'Панель курьера',
      language: 'Язык'
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = sessionStorage.getItem('user');
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
            sessionStorage.setItem('user', JSON.stringify({ id: userData.id, name: userData.full_name, phone: userData.phone }));
          }
        }
      } catch (err) {
        console.log('Фоновый запрос не удался');
      }
    };
    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header с кнопками языка */}
      <div className="bg-[#367666] text-white pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">{t[lang].profile}</h1>
          
          {/* Кнопки языка */}
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'kz' 
                  ? 'bg-white text-[#367666]' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'ru' 
                  ? 'bg-white text-[#367666]' 
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