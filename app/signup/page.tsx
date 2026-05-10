'use client'

import { useState } from 'react'

export default function SignupPage() {
  const [lang, setLang] = useState<'kz' | 'ru'>('ru')

  const translations = {
    kz: {
      logo: 'Sarqyn Food',
      title: 'Тіркелу',
      namePlaceholder: 'Толық аты-жөні',
      emailPlaceholder: 'Электрондық пошта',
      phonePlaceholder: 'Телефон нөмірі',
      passwordPlaceholder: 'Құпия сөз',
      confirmPasswordPlaceholder: 'Құпия сөзді растау',
      signup: 'Тіркелу',
      haveAccount: 'Аккаунтыңыз бар ма?',
      login: 'Кіру',
    },
    ru: {
      logo: 'Sarqyn Food',
      title: 'Регистрация',
      namePlaceholder: 'Полное имя',
      emailPlaceholder: 'Электронная почта',
      phonePlaceholder: 'Номер телефона',
      passwordPlaceholder: 'Пароль',
      confirmPasswordPlaceholder: 'Подтвердите пароль',
      signup: 'Зарегистрироваться',
      haveAccount: 'Уже есть аккаунт?',
      login: 'Войти',
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
              lang === 'kz' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Қазақша
          </button>
          <button
            onClick={() => setLang('ru')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              lang === 'ru' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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

        {/* Title */}
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">{t.title}</h2>

        {/* Signup Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder={t.namePlaceholder}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
          />
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
          />
          <input
            type="tel"
            placeholder={t.phonePlaceholder}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
          />
          <input
            type="password"
            placeholder={t.passwordPlaceholder}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
          />
          <input
            type="password"
            placeholder={t.confirmPasswordPlaceholder}
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200"
          />

          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg transition">
            {t.signup}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {t.haveAccount}{' '}
            <a href="/" className="text-emerald-600 font-semibold hover:underline">
              {t.login}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}