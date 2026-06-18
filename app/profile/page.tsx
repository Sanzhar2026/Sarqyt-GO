// app/profile/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Единая функция для получения токена
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('courierToken') || 
           sessionStorage.getItem('authToken') ||
           null;
  };

  // ✅ Получение данных пользователя
  const getUserData = () => {
    // Пробуем получить из 'user'
    let userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {}
    }
    
    // Если нет - пробуем из 'courier'
    const courierStr = sessionStorage.getItem('courier');
    if (courierStr) {
      try {
        const courier = JSON.parse(courierStr);
        return {
          id: courier.id || Date.now(),
          full_name: `${courier.first_name || ''} ${courier.last_name || ''}`.trim() || 'Курьер',
          phone: courier.phone || '',
          role: 'courier'
        };
      } catch (e) {}
    }
    
    return null;
  };

  useEffect(() => {
    // Проверяем токен
    const token = getAuthToken();
    console.log('🔑 Токен на странице профиля:', token ? 'Есть ✅' : 'Нет ❌');
    
    if (!token) {
      console.log('❌ Нет токена, редирект на логин');
      router.push('/login');
      return;
    }
    
    // Получаем данные пользователя
    const userData = getUserData();
    if (userData) {
      console.log('✅ Данные пользователя:', userData);
      setUser(userData);
    } else {
      console.log('❌ Нет данных пользователя, редирект на логин');
      router.push('/login');
    }
    
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('userToken');
      sessionStorage.removeItem('courierToken');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('courier');
      sessionStorage.removeItem('isLoggedIn');
      sessionStorage.removeItem('isCourierLoggedIn');
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Пожалуйста, войдите в аккаунт</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  const isCourier = user.role === 'courier';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#367666] text-white p-6">
        <button onClick={() => router.back()} className="mb-4 text-white hover:opacity-80 transition">
          ← Назад
        </button>
        <h1 className="text-2xl font-bold">Профиль</h1>
      </div>

      <div className="px-6 py-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl mb-3">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{user.full_name || 'Пользователь'}</h2>
          <p className="text-gray-500 text-sm">{user.phone || 'Телефон не указан'}</p>
          <p className="text-xs text-gray-400 mt-1">
            {isCourier ? '🚚 Курьер' : '👤 Клиент'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-lg mb-4">Информация</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Имя</span>
              <span className="font-medium">{user.full_name || 'Не указано'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Телефон</span>
              <span className="font-medium">{user.phone || 'Не указан'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Роль</span>
              <span className="font-medium">
                {isCourier ? '🚚 Курьер' : '👤 Клиент'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isCourier && (
            <Link href="/courier/dashboard">
              <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
                🚚 Панель курьера
              </button>
            </Link>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}