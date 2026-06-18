// app/courier/register/page.tsx - С НОВЫМ ДИЗАЙНОМ

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, 
  User, 
  Phone, 
  Lock, 
  Car, 
  Footprints, 
  ArrowLeft,
  CheckCircle 
} from 'lucide-react';

export default function CourierRegisterPage() {
  const router = useRouter();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50/50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-emerald-600/60" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Заявка отправлена!</h1>
          <p className="text-gray-400 text-sm mb-6">
            Ваша заявка на регистрацию курьера отправлена на рассмотрение.
          </p>
          <Link href="/courier/dashboard">
            <button className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20">
              В панель курьера
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 overflow-y-auto">
      <div className="max-w-md mx-auto pb-20">
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          
          {/* Иконка грузовика - прозрачная */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-50/50 flex items-center justify-center">
              <Truck size={40} className="text-emerald-600/60" strokeWidth={1.5} />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Регистрация курьера</h1>
            <p className="text-gray-400 text-sm mt-1">Выберите тип доставки</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-200">
              ❌ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Имя *</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  placeholder="Иван"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
            </div>
            
            {/* Фамилия */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Фамилия *</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  placeholder="Петров"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>
            
            {/* Тип курьера */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">Тип курьера *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, courier_type: 'pedestrian', car_model: '', car_number: ''})}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    formData.courier_type === 'pedestrian' 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <Footprints size={28} className={`mx-auto mb-1 ${formData.courier_type === 'pedestrian' ? 'text-emerald-600/80' : 'text-gray-400/60'}`} strokeWidth={1.5} />
                  <div className="text-sm font-medium text-gray-700">Пеший</div>
                  <div className="text-xs text-gray-400 mt-1">Радиус 3 км</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({...formData, courier_type: 'driver'})}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    formData.courier_type === 'driver' 
                      ? 'border-emerald-500 bg-emerald-50/50' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <Car size={28} className={`mx-auto mb-1 ${formData.courier_type === 'driver' ? 'text-emerald-600/80' : 'text-gray-400/60'}`} strokeWidth={1.5} />
                  <div className="text-sm font-medium text-gray-700">На машине</div>
                  <div className="text-xs text-gray-400 mt-1">Радиус 15 км</div>
                </button>
              </div>
            </div>
            
            {/* Поля для водителя */}
            {formData.courier_type === 'driver' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Модель автомобиля</label>
                  <div className="relative">
                    <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
                    <input
                      type="text"
                      placeholder="Toyota Camry"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                      value={formData.car_model}
                      onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Госномер</label>
                  <div className="relative">
                    <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
                    <input
                      type="text"
                      placeholder="A123BC"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                      value={formData.car_number}
                      onChange={(e) => setFormData({...formData, car_number: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}
            
            {/* Телефон */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Телефон *</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
                <input
                  type="tel"
                  required
                  placeholder="+7 777 123 4567"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            
            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Пароль *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            
            {/* Подтверждение пароля */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Подтверждение пароля *</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300/70" strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Регистрация...
                </span>
              ) : 'Зарегистрироваться'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              Уже есть аккаунт?{' '}
              <Link href="/courier/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition">
                Войти
              </Link>
            </p>
          </div>
          
          <div className="text-center mt-4">
            <Link href="/" className="text-xs text-gray-300 hover:text-gray-500 transition inline-flex items-center gap-1">
              <ArrowLeft size={12} className="opacity-50" />
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}