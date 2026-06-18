// app/courier/login/page.tsx - С ОБНОВЛЕННЫМ ДИЗАЙНОМ

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Truck, Phone, Lock, ArrowLeft } from 'lucide-react';

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

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('courierToken') || 
           sessionStorage.getItem('authToken') ||
           null;
  };

  useEffect(() => {
    let isMounted = true;
    
    const checkAlreadyLoggedIn = async () => {
      if (redirectingRef.current) return;
      
      try {
        const token = getAuthToken();
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
              sessionStorage.setItem('userToken', token);
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
  }, [API_URL]);

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
        if (data.token) {
          sessionStorage.setItem('courierToken', data.token);
          sessionStorage.setItem('userToken', data.token);
        }
        
        const courierData = {
          id: data.courier.id,
          first_name: data.courier.first_name,
          last_name: data.courier.last_name,
          phone: data.courier.phone,
          is_verified: data.courier.is_verified,
          courier_type: data.courier.courier_type,
          role: 'courier'
        };
        sessionStorage.setItem('courier', JSON.stringify(courierData));
        
        sessionStorage.setItem('user', JSON.stringify({
          id: data.courier.id,
          full_name: `${data.courier.first_name} ${data.courier.last_name}`,
          phone: data.courier.phone,
          role: 'courier'
        }));
        
        sessionStorage.setItem('isCourierLoggedIn', 'true');
        
        console.log('✅ Успешный вход, данные сохранены');
        
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
        
        {/* Иконка грузовика - прозрачная */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50/50 flex items-center justify-center">
            <Truck size={40} className="text-emerald-600/60" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Sarqyt GO</h1>
          <p className="text-gray-400 text-sm mt-1">Вход для курьеров</p>
        </div>

        {error && (
          <div className={`p-3 rounded-xl mb-4 text-sm ${pendingVerification ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {pendingVerification ? (
              <div className="text-center">
                <div className="text-2xl mb-2">⏳</div>
                <p className="font-medium">Ваша заявка на рассмотрении</p>
                <p className="text-xs mt-1 opacity-80">Администратор проверит данные и подтвердит аккаунт</p>
              </div>
            ) : (
              error
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Номер телефона
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
              <input
                type="tel"
                placeholder="+77071234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || redirectingRef.current}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 text-lg mt-2 shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Вход...
              </span>
            ) : 'Войти'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            Нет аккаунта?{' '}
            <Link href="/courier/register" className="text-emerald-600 font-medium hover:text-emerald-700 transition">
              Стать курьером
            </Link>
          </p>
        </div>
        
        <div className="text-center mt-4">
          <Link href="/courier/dashboard" className="text-xs text-gray-300 hover:text-gray-500 transition inline-flex items-center gap-1">
            <ArrowLeft size={12} className="opacity-50" />
            В панель курьера
          </Link>
        </div>
      </div>
    </div>
  );
}