// app/courier/login/page.tsx - ПОЛНАЯ ВЕРСИЯ

'use client';

import { useState, useEffect, useRef } from 'react';
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
  
  const redirectingRef = useRef(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Проверка уже залогинен ли курьер
  useEffect(() => {
    let isMounted = true;
    
    const checkAlreadyLoggedIn = async () => {
      if (redirectingRef.current) return;
      
      try {
        const token = sessionStorage.getItem('courierToken');
        const courierData = sessionStorage.getItem('courier');
        
        if (token && courierData) {
          console.log('✅ Найдены данные в sessionStorage');
          redirectingRef.current = true;
          if (isMounted) {
            window.location.href = '/courier/dashboard';
          }
          return;
        }
        
        if (token) {
          const response = await fetch(`${API_URL}/api/courier/status`, {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.is_verified === true) {
              sessionStorage.setItem('courier', JSON.stringify({
                ...data,
                role: 'courier'
              }));
              redirectingRef.current = true;
              if (isMounted) {
                window.location.href = '/courier/dashboard';
              }
              return;
            }
          }
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };
    
    checkAlreadyLoggedIn();
    
    return () => {
      isMounted = false;
    };
  }, [router, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (redirectingRef.current) return;
    
    setLoading(true);
    setError('');
    setPendingVerification(false);

    try {
      console.log('🔐 Попытка входа курьера:', phone);
      
      const response = await fetch(`${API_URL}/api/courier/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      console.log('📥 Ответ сервера:', response.status, data);

      if (response.ok && data.success) {
        // ✅ Сохраняем токен
        if (data.token) {
          sessionStorage.setItem('courierToken', data.token);
        }
        
        // ✅ Сохраняем данные курьера с РОЛЬЮ
        const courierData = {
          id: data.courier.id,
          first_name: data.courier.first_name,
          last_name: data.courier.last_name,
          phone: data.courier.phone,
          is_verified: data.courier.is_verified,
          courier_type: data.courier.courier_type,
          role: 'courier' // ← ЯВНО УКАЗЫВАЕМ РОЛЬ
        };
        sessionStorage.setItem('courier', JSON.stringify(courierData));
        
        // ✅ Также сохраняем в 'user' для единообразия
        sessionStorage.setItem('user', JSON.stringify({
          id: data.courier.id,
          full_name: `${data.courier.first_name} ${data.courier.last_name}`,
          phone: data.courier.phone,
          role: 'courier'
        }));
        
        sessionStorage.setItem('isCourierLoggedIn', 'true');
        
        console.log('✅ Успешный вход, данные сохранены');
        console.log('👤 Роль:', JSON.parse(sessionStorage.getItem('user')!).role);
        
        // ✅ Используем window.location для принудительного редиректа
        redirectingRef.current = true;
        window.location.href = '/courier/dashboard';
        
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
          <div className="text-5xl mb-3">🚚</div>
          <h1 className="text-2xl font-bold text-emerald-600">Sarqyt GO</h1>
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
            disabled={loading || redirectingRef.current}
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