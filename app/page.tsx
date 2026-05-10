'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function LoginPage() {
  const [lang, setLang] = useState<'kz' | 'ru'>('ru')

  const translations = {
    kz: {
      logo: 'Sarqyn Food',
      emailPlaceholder: 'Электрондық пошта',
      passwordPlaceholder: 'Құпия сөз',
      forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
      login: 'Кіру',
      noAccount: 'Аккаунтыңыз жоқ па?',
      signup: 'Тіркелу',
      greeting: 'Қош келдіңіз!',
      subtitle: 'Тағамды құтқарыңыз, планетаны сақтаңыз',
    },
    ru: {
      logo: 'Sarqyn Food',
      emailPlaceholder: 'Электронная почта',
      passwordPlaceholder: 'Пароль',
      forgotPassword: 'Забыли пароль?',
      login: 'Войти',
      noAccount: 'Нет аккаунта?',
      signup: 'Зарегистрироваться',
      greeting: 'Добро пожаловать!',
      subtitle: 'Спасайте еду, сохраняйте планету',
    }
  }

  const t = translations[lang]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white p-6">
      <div className="max-w-md mx-auto">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={() => setLang('kz')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              lang === 'kz' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Қазақша
          </button>
          <button
            onClick={() => setLang('ru')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              lang === 'ru' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Русский
          </button>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl">🌱</span>
            </div>
            <h1 className="text-3xl font-bold text-emerald-600">{t.logo}</h1>
          </div>
        </div>

        {/* Greeting */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800">{t.greeting}</h2>
          <p className="text-gray-500 mt-1">{t.subtitle}</p>
        </div>

        {/* Illustration */}
        <div className="flex justify-center mb-10">
          <div className="relative w-64 h-64">
            <div className="text-8xl text-center">🍽️💚</div>
          </div>
        </div>

        {/* Login Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
          />
          <input
            type="password"
            placeholder={t.passwordPlaceholder}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
          />

          <p className="text-right text-emerald-600 text-sm cursor-pointer hover:underline">
            {t.forgotPassword}
          </p>

          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg transition">
            {t.login}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {t.noAccount}{' '}
            <a href="/signup" className="text-emerald-600 font-semibold hover:underline">
              {t.signup}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}