// app/courier/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CourierRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    confirm_password: '',
    courier_type: 'pedestrian',
    car_model: '',
    car_number: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirm_password) {
      setError('Пароли не совпадают');
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('https://toogood-2ncf.onrender.com/courier/register', {
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
    } catch {
      setError('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 text-center max-w-md">
          <div className="text-5xl mb-3">📝</div>
          <h1 className="text-xl font-bold mb-1">Заявка отправлена!</h1>
          <p className="text-gray-500 text-sm mb-4">После проверки администратор свяжется с вами.</p>
          <Link href="/"><button className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold">На главную</button></Link>
        </div>
      </div>
    );
  }

  return (
    // ✅ Добавляем overflow-y-auto для прокрутки
    <div className="min-h-screen bg-gray-50 py-6 px-4 overflow-y-auto">
      <div className="max-w-md mx-auto pb-20">
        <div className="bg-white rounded-xl p-5 shadow-md">
          <div className="text-center mb-4">
            <div className="text-4xl mb-1">🚚</div>
            <h1 className="text-lg font-bold">Регистрация курьера</h1>
            <p className="text-gray-500 text-xs">Выберите тип доставки</p>
          </div>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded-lg mb-3 text-xs">
              ❌ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="text"
              placeholder="Имя *"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
            />
            
            <input
              type="text"
              placeholder="Фамилия *"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
            />
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, courier_type: 'pedestrian', car_model: '', car_number: ''})}
                className={`flex-1 p-2.5 rounded-lg border text-center transition ${formData.courier_type === 'pedestrian' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
              >
                <div className="text-xl">🚶</div>
                <div className="text-xs font-medium">Пеший</div>
                <div className="text-[10px] text-gray-400">3 км</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, courier_type: 'driver'})}
                className={`flex-1 p-2.5 rounded-lg border text-center transition ${formData.courier_type === 'driver' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}`}
              >
                <div className="text-xl">🚗</div>
                <div className="text-xs font-medium">На машине</div>
                <div className="text-[10px] text-gray-400">15 км</div>
              </button>
            </div>
            
            {formData.courier_type === 'driver' && (
              <>
                <input
                  type="text"
                  placeholder="Модель авто"
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
                  value={formData.car_model}
                  onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Госномер"
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
                  value={formData.car_number}
                  onChange={(e) => setFormData({...formData, car_number: e.target.value})}
                />
              </>
            )}
            
            <input
              type="tel"
              placeholder="Телефон *"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
            
            <input
              type="password"
              placeholder="Пароль *"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            
            <input
              type="password"
              placeholder="Подтверждение пароля *"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm"
              value={formData.confirm_password}
              onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-semibold text-sm mt-2"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          
          <div className="text-center mt-3">
            <Link href="/courier/login" className="text-xs text-emerald-600">
              ← Уже есть аккаунт? Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}