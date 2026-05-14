'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, type Language } from '@/lib/i18n';
import { useLanguage } from '../layout';

export default function ProfilePage() {
  const router = useRouter();
 const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  const API_URL = 'https://toogood-2ncf.onrender.com';

  useEffect(() => {
    const loadUserData = async () => {
      console.log('🔍 Загрузка данных пользователя...');
      
      // ✅ 1. Сначала ИМЕДИАТНО показываем данные из localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          console.log('✅ Загружено из localStorage (мгновенно)');
          setUser({
            id: parsed.id,
            full_name: parsed.full_name || parsed.name,
            phone: parsed.phone
          });
          setLoading(false); // ✅ Сразу убираем загрузку!
        } catch(e) {}
      } else {
        setLoading(false);
      }
      
      // ✅ 2. Фоновый запрос к бэкенду (не блокирует UI)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
        
        const res = await fetch(`${API_URL}/api/check-auth`, { 
          credentials: 'include',
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const userData = {
              id: data.user_id,
              full_name: data.user_name,
              phone: data.user_phone || ''
            };
            // Обновляем UI и localStorage только если данные изменились
            setUser(userData);
            localStorage.setItem('user', JSON.stringify({
              id: userData.id,
              name: userData.full_name,
              phone: userData.phone
            }));
          }
        }
      } catch (err) {
        console.log('Фоновый запрос не удался, но данные уже есть из localStorage');
      }
    };
    
    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { 
        method: 'GET', 
        credentials: 'include' 
      });
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      setUser(null);
      window.location.href = '/';
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
      <div className="bg-emerald-600 text-white pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">{t.profile}</h1>
          <div className="flex gap-2">
        
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl">
            {isLoggedIn ? '👤' : '👋'}
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {isLoggedIn ? (user?.full_name || user?.phone) : t.welcome}
            </h2>
            <p className="text-emerald-100 text-sm">
              {isLoggedIn ? user?.phone : t.login}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {!isLoggedIn ? (
          <>
            <Link href="/login"><div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition"><span className="flex items-center gap-3"><span className="text-2xl">🔑</span><span className="font-medium">{t.login}</span></span><span className="text-gray-400">→</span></div></Link>
            <Link href="/signup"><div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition"><span className="flex items-center gap-3"><span className="text-2xl">📝</span><span className="font-medium">{t.register}</span></span><span className="text-gray-400">→</span></div></Link>
          </>
        ) : (
          <>
            <Link href="/offers"><div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition"><span className="flex items-center gap-3"><span className="text-2xl">📦</span><span className="font-medium">{t.myOrders}</span></span><span className="text-gray-400">→</span></div></Link>
            <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm"><span className="flex items-center gap-3"><span className="text-2xl">📞</span><span className="font-medium">{t.phone}</span></span><span className="text-gray-500 text-sm">{user?.phone}</span></div>
            <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm"><span className="flex items-center gap-3"><span className="text-2xl">🌍</span><span className="font-medium">{t.language}</span></span><div className="flex gap-2"><button onClick={() => setLang('kz')} className={`px-3 py-1 rounded-full text-sm ${lang === 'kz' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>Қаз</button><button onClick={() => setLang('ru')} className={`px-3 py-1 rounded-full text-sm ${lang === 'ru' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>Рус</button></div></div>
            <button onClick={handleLogout} className="w-full bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:bg-red-50 transition text-red-600"><span className="flex items-center gap-3"><span className="text-2xl">🚪</span><span className="font-medium">{t.logout}</span></span><span className="text-red-400">→</span></button>
          </>
        )}
      </div>
    </div>
  );
}