'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://toogood-2ncf.onrender.com';

  useEffect(() => {
    const token = sessionStorage.getItem('userToken');
    const user = sessionStorage.getItem('user');
    if (token && user) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Попытка входа:', phone);
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('📥 Ответ сервера:', response.status, data);

      if (response.ok && data.success) {
        // ✅ Сохраняем пользователя
        const userData = {
          id: data.user.id,
          name: data.user.full_name,
          full_name: data.user.full_name,
          phone: data.user.phone,
          role: data.user.role || 'customer'
        };
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // ✅ Сохраняем токен как 'userToken'
        if (data.token) {
          sessionStorage.setItem('userToken', data.token);
          console.log('✅ Токен сохранен как userToken');
        } else {
          console.error('❌ Токен не получен от сервера!');
        }
        
        sessionStorage.setItem('isLoggedIn', 'true');
        
        console.log('🔑 userToken:', sessionStorage.getItem('userToken'));
        console.log('👤 user:', sessionStorage.getItem('user'));
        
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
      } else {
        setError(data.error || 'Неверный телефон или пароль');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🍽️</div>
            <h1 className="text-3xl font-bold text-[#367666]">Добро пожаловать</h1>
            <p className="text-gray-500 text-sm mt-2">Войдите в свой аккаунт</p>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
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
              className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg mt-6 hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Вход...
                </span>
              ) : 'Войти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Нет аккаунта?{' '}
              <Link href="/signup" className="text-[#367666] font-semibold hover:underline">
                Зарегистрироваться
              </Link>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
              ← На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}