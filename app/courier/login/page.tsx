// app/courier/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CourierLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  useEffect(() => {
    const checkAlreadyLoggedIn = async () => {
      try {
        // ✅ ИСПОЛЬЗУЕМ sessionStorage (не localStorage)
        const token = sessionStorage.getItem('courierToken');
        const courierData = sessionStorage.getItem('courier');
        
        if (token && courierData) {
          console.log('✅ Найдены данные в sessionStorage');
          window.location.replace('/courier/dashboard');
          return;
        }
        
        // Проверяем через API с токеном из sessionStorage
        const response = await fetch(`${API_URL}/api/courier/status`, {
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        console.log('🔍 Проверка статуса курьера:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.is_verified === true) {
            // Сохраняем данные в sessionStorage
            sessionStorage.setItem('courier', JSON.stringify(data));
            sessionStorage.setItem('courierToken', data.token || 'true');
            window.location.replace('/courier/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAlreadyLoggedIn();
  }, [API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPendingVerification(false);

    try {
      console.log('🔐 Попытка входа курьера:', phone);
      
      const response = await fetch(`${API_URL}/api/courier/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('📥 Ответ сервера:', response.status, data);

      if (response.ok && data.success) {
        // ✅ СОХРАНЯЕМ ТОЛЬКО В sessionStorage
        if (data.token) {
          sessionStorage.setItem('courierToken', data.token);
        }
        
        sessionStorage.setItem('courier', JSON.stringify({
          ...data.courier,
          is_verified: true
        }));
        sessionStorage.setItem('isCourierLoggedIn', 'true');
        
        console.log('✅ Успешный вход, данные сохранены в sessionStorage');
        window.location.replace('/courier/dashboard');
      } else if (response.status === 403) {
        setPendingVerification(true);
        setError(data.detail || 'Ваша учетная запись ожидает подтверждения администратора');
      } else {
        setError(data.detail || data.message || 'Неверный телефон или пароль');
      }
    } catch (err) {
      console.error('❌ Ошибка входа:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-emerald-600 rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-3 text-sm">Проверка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚚</div>
          <h1 className="text-2xl font-bold text-emerald-600">Sarqyn GO</h1>
          <p className="text-gray-500 mt-2">Вход для курьеров</p>
        </div>

        {error && (
          <div className={`p-3 rounded-xl mb-4 text-sm ${pendingVerification ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {pendingVerification ? (
              <div className="text-center">
                <div className="text-2xl mb-2">⏳</div>
                <p className="font-medium">Ваша заявка на рассмотрении</p>
                <p className="text-xs mt-1">Администратор проверит данные и подтвердит аккаунт</p>
              </div>
            ) : (
              error
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="tel"
            placeholder="Телефон (+77071234567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Нет аккаунта?{' '}
            <Link href="/courier/register" className="text-emerald-600 font-medium">
              Стать курьером
            </Link>
          </p>
        </div>
        
        <div className="text-center mt-4">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  );
}