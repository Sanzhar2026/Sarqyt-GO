// app/courier/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CourierRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    password: '',
    confirm_password: '',
    car_model: '',
    car_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const API_URL = 'https://toogood-2ncf.onrender.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirm_password) {
      setError('Пароли не совпадают');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/courier/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          password: formData.password,
          car_model: formData.car_model,
          car_number: formData.car_number
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setRegistered(true);
      } else {
        setError(data.detail || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">📝</div>
            <h1 className="text-2xl font-bold mb-2">Заявка отправлена!</h1>
            <p className="text-gray-600 mb-6">
              Ваша заявка на регистрацию курьера отправлена на рассмотрение администратору.
              После подтверждения вы получите уведомление.
            </p>
            <div className="bg-yellow-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-700">
                ⏱️ Обычно проверка занимает до 24 часов.
                После одобрения вы сможете войти в систему как курьер.
              </p>
            </div>
            <Link href="/">
              <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold">
                На главную
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-md mx-auto">
        <Link href="/profile" className="text-emerald-600 mb-4 inline-block">← Назад</Link>
        
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🚚</div>
            <h1 className="text-2xl font-bold">Регистрация курьера</h1>
            <p className="text-gray-500 text-sm mt-2">Заполните форму. После проверки вы сможете начать работу</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
              ❌ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ФИО *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Телефон *</label>
              <input
                type="tel"
                required
                placeholder="+7 777 123 4567"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Пароль *</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Подтверждение пароля *</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.confirm_password}
                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Модель автомобиля</label>
              <input
                type="text"
                placeholder="Toyota Camry"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.car_model}
                onChange={(e) => setFormData({...formData, car_model: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Госномер</label>
              <input
                type="text"
                placeholder="A123BC"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.car_number}
                onChange={(e) => setFormData({...formData, car_number: e.target.value})}
              />
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-3 mt-2">
              <p className="text-xs text-yellow-700">
                ⚠️ После отправки заявки, администратор проверит ваши данные.
                Вы получите уведомление после подтверждения.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            Уже есть аккаунт? <Link href="/login" className="text-blue-600">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}