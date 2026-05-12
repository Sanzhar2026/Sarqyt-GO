'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Language = 'kz' | 'ru';

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('kz');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = {
    kz: {
      title: 'Кіру',
      email: 'Электрондық пошта',
      emailPlaceholder: 'example@email.com',
      password: 'Құпия сөз',
      submit: 'Кіру',
      submitting: 'Кіруде...',
      noAccount: 'Аккаунтыңыз жоқ па?',
      signup: 'Тіркелу',
      invalidCredentials: 'Қате электрондық пошта немесе құпия сөз',
      welcome: 'Қош келдіңіз!',
    },
    ru: {
      title: 'Вход',
      email: 'Электронная почта',
      emailPlaceholder: 'example@email.com',
      password: 'Пароль',
      submit: 'Войти',
      submitting: 'Вход...',
      noAccount: 'Нет аккаунта?',
      signup: 'Зарегистрироваться',
      invalidCredentials: 'Неверная почта или пароль',
      welcome: 'Добро пожаловать!',
    },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleLanguage = () => {
    setLang(lang === 'kz' ? 'ru' : 'kz');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
        router.refresh();
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
    <div className="min-h-screen bg-white">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={toggleLanguage}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            lang === 'kz'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Қазақша
        </button>
        <button
          onClick={toggleLanguage}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            lang === 'ru'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Русский
        </button>
      </div>

      {/* Food Image Header */}
      <div 
        className="h-72 bg-cover bg-center relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1565299623643-3f8b3e4d6e3f?q=80&w=2070')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-bold">{t[lang].title}</h1>
        </div>
      </div>

      {/* Form Section */}
      <div className="px-6 -mt-6 relative bg-white rounded-t-3xl pt-8 pb-12">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-2xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder={t[lang].emailPlaceholder}
            value={formData.email}
            onChange={handleChange}
            className="w-full px-5 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            required
          />

          <input
            type="password"
            name="password"
            placeholder={t[lang].password}
            value={formData.password}
            onChange={handleChange}
            className="w-full px-5 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg mt-6 hover:bg-emerald-700 transition disabled:opacity-70"
          >
            {loading ? t[lang].submitting : t[lang].submit}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-8">
          {t[lang].noAccount}{' '}
          <Link href="/signup" className="text-emerald-600 font-semibold">
            {t[lang].signup}
          </Link>
        </p>
      </div>
    </div>
  );
}