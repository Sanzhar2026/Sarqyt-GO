// app/courier/register/page.tsx - с выбором типа

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CourierRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    confirm_password: '',
    courier_type: 'pedestrian',  // 'pedestrian' или 'driver'
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
    
    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }
    
    // Для водителей проверяем данные об авто
    if (formData.courier_type === 'driver' && !formData.car_model) {
      setError('Укажите модель автомобиля');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/courier/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          password: formData.password,
          courier_type: formData.courier_type,
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
      setError('Ошибка соединения с сервером');
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
              Ваша заявка на регистрацию курьера отправлена на рассмотрение.
            </p>
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
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🚚</div>
            <h1 className="text-2xl font-bold">Регистрация курьера</h1>
            <p className="text-gray-500 text-sm mt-2">Выберите тип доставки</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">
              ❌ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium mb-1">Имя *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              />
            </div>
            
            {/* Фамилия */}
            <div>
              <label className="block text-sm font-medium mb-1">Фамилия *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              />
            </div>
            
            {/* Тип курьера */}
            <div>
              <label className="block text-sm font-medium mb-3">Тип курьера *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, courier_type: 'pedestrian', car_model: '', car_number: ''})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.courier_type === 'pedestrian' 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">🚶</div>
                  <div className="text-sm font-medium">Пеший</div>
                  <div className="text-xs text-gray-400 mt-1">Радиус 3 км</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, courier_type: 'driver'})}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.courier_type === 'driver' 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">🚗</div>
                  <div className="text-sm font-medium">На машине</div>
                  <div className="text-xs text-gray-400 mt-1">Радиус 15 км</div>
                </button>
              </div>
            </div>
            
            {/* Поля для водителя */}
            {formData.courier_type === 'driver' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Модель автомобиля</label>
                  <input
                    type="text"
                    placeholder="Toyota Camry"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    value={formData.car_model}
                    onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Госномер</label>
                  <input
                    type="text"
                    placeholder="A123BC"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    value={formData.car_number}
                    onChange={(e) => setFormData({...formData, car_number: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {/* Телефон */}
            <div>
              <label className="block text-sm font-medium mb-1">Телефон *</label>
              <input
                type="tel"
                required
                placeholder="+7 777 123 4567"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium mb-1">Пароль *</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            {/* Подтверждение пароля */}
            <div>
              <label className="block text-sm font-medium mb-1">Подтверждение пароля *</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                value={formData.confirm_password}
                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold mt-4"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          
          <p className="text-center text-sm text-gray-500 mt-6">
            Уже есть аккаунт? <Link href="/login" className="text-emerald-600">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}