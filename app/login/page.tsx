// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo';

type Language = 'kz' | 'ru';

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('kz');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const t = {
    kz: {
      title: 'Қош келдіңіз',
      subtitle: 'Аккаунтыңызға кіріңіз',
      phone: 'Телефон нөмірі',
      phonePlaceholder: '+77071234567',
      password: 'Құпия сөз',
      submit: 'Кіру',
      submitting: 'Кіруде...',
      noAccount: 'Аккаунтыңыз жоқ па?',
      signup: 'Тіркелу',
      invalidCredentials: 'Қате телефон немесе құпия сөз',
    },
    ru: {
      title: 'Добро пожаловать',
      subtitle: 'Войдите в свой аккаунт',
      phone: 'Номер телефона',
      phonePlaceholder: '+77071234567',
      password: 'Пароль',
      submit: 'Войти',
      submitting: 'Вход...',
      noAccount: 'Нет аккаунта?',
      signup: 'Зарегистрироваться',
      invalidCredentials: 'Неверный телефон или пароль',
    },
  };

  const toggleLanguage = () => {
    setLang(lang === 'kz' ? 'ru' : 'kz');
    setError('');
  };

  // app/login/page.tsx - исправленный handleSubmit

const handleSuccess = (data: any) => {
    localStorage.setItem('user', JSON.stringify({
      id: data.user?.id || data.user_id,
      name: data.user?.full_name,
      full_name: data.user?.full_name,
      phone: data.user?.phone
    }));
    localStorage.setItem('isLoggedIn', 'true');

    window.dispatchEvent(new Event('authUpdated'));
    
    const redirectTo = localStorage.getItem('redirectAfterLogin') || '/';
    localStorage.removeItem('redirectAfterLogin');
    
    window.location.href = redirectTo;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        handleSuccess(data);   // ← Используем функцию успеха
      } else {
        setError(data.error || t[lang].invalidCredentials);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t[lang].invalidCredentials);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={toggleLanguage} className={`px-4 py-2 rounded-full text-sm font-medium transition ${lang === 'kz' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'}`}>Қаз</button>
        <button onClick={toggleLanguage} className={`px-4 py-2 rounded-full text-sm font-medium transition ${lang === 'ru' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'}`}>Рус</button>
      </div>

      <div className="flex flex-col items-center justify-center pt-12 pb-6">
        <Logo size="large" showText={true} />
      </div>

      <div className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{t[lang].title}</h2>
          <p className="text-center text-gray-500 text-sm mb-8">{t[lang].subtitle}</p>

          {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].phone}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t[lang].phonePlaceholder} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].password}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg mt-6 hover:bg-emerald-700 transition disabled:opacity-70 shadow-md">
              {loading ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{t[lang].submitting}</span> : t[lang].submit}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8">{t[lang].noAccount} <Link href="/signup" className="text-emerald-600 font-semibold hover:underline">{t[lang].signup}</Link></p>
        </div>
      </div>
    </div>
  );
}