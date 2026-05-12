'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Language = 'kz' | 'ru';

export default function SignupPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('kz');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Translations
  const t = {
    kz: {
      title: 'Тіркелу',
      firstName: 'Аты',
      lastName: 'Тегі',
      email: 'Электрондық пошта',
      emailPlaceholder: 'example@email.com',
      password: 'Құпия сөз',
      confirmPassword: 'Құпия сөзді растаңыз',
      submit: 'Тіркелу',
      submitting: 'Тіркелуде...',
      haveAccount: 'Аккаунтыңыз бар ма?',
      login: 'Кіру',
      passwordMismatch: 'Құпия сөздер сәйкес келмейді',
      error: 'Қате кетті, қайталап көріңіз',
      welcome: 'Қош келдіңіз!',
    },
    ru: {
      title: 'Регистрация',
      firstName: 'Имя',
      lastName: 'Фамилия',
      email: 'Электронная почта',
      emailPlaceholder: 'example@email.com',
      password: 'Пароль',
      confirmPassword: 'Подтвердите пароль',
      submit: 'Зарегистрироваться',
      submitting: 'Регистрация...',
      haveAccount: 'Уже есть аккаунт?',
      login: 'Войти',
      passwordMismatch: 'Пароли не совпадают',
      error: 'Ошибка, попробуйте еще раз',
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t[lang].passwordMismatch);
      setLoading(false);
      return;
    }

    // API Request to your backend
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful - auto login
        const loginResponse = await fetch('https://toogood-2ncf.onrender.com/api/login', {
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

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user', JSON.stringify(loginData.user));
          router.push('/');
          router.refresh();
        } else {
          router.push('/login');
        }
      } else {
        setError(data.detail || t[lang].error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(t[lang].error);
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
            type="text"
            name="firstName"
            placeholder={t[lang].firstName}
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-5 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            required
          />

          <input
            type="text"
            name="lastName"
            placeholder={t[lang].lastName}
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-5 py-4 bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
            required
          />

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

          <input
            type="password"
            name="confirmPassword"
            placeholder={t[lang].confirmPassword}
            value={formData.confirmPassword}
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
          {t[lang].haveAccount}{' '}
          <Link href="/login" className="text-emerald-600 font-semibold">
            {t[lang].login}
          </Link>
        </p>
      </div>
    </div>
  );
}