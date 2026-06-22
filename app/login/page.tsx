// app/login/page.tsx - ТОЛЬКО ОТНОСИТЕЛЬНЫЕ ПУТИ!

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ❌ УБЕРИ - НЕ НУЖНО!
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ ОТНОСИТЕЛЬНЫЙ ПУТЬ
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('userToken', data.token);
          sessionStorage.setItem('userToken', data.token);
        }
        
        if (data.user) {
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = '/';
      } else {
        setError(data.detail || 'Неверный телефон или пароль');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-8">Вход</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Номер телефона</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+77071234567" 
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg mt-4 hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Вход...
                </span>
              ) : 'Войти'}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-sm text-gray-400 hover:text-[#367666] transition">
              Забыли пароль?
            </Link>
          </div>

          <p className="text-center text-gray-500 mt-6">
            Нет аккаунта?{' '}
            <Link href="/signup" className="text-[#367666] font-semibold hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}