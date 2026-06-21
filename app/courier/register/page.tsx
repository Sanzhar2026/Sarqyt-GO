// app/courier/register/page.tsx - С ПРОЗРАЧНЫМИ ИКОНКАМИ

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
import { useLanguage } from '../../layout';

export default function CourierRegisterPage() {
  const router = useRouter();
  const { lang } = useLanguage();
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

  const t = {
    kz: {
      title: 'Курьер тіркеу',
      subtitle: 'Жеткізу түрін таңдаңыз',
      firstName: 'Аты *',
      lastName: 'Тегі *',
      courierType: 'Курьер түрі *',
      pedestrian: 'Жаяу',
      pedestrianRadius: 'Радиус 3 км',
      driver: 'Көлікпен',
      driverRadius: 'Радиус 15 км',
      carModel: 'Көлік моделі',
      carNumber: 'Мемлекеттік нөмір',
      phone: 'Телефон *',
      password: 'Құпия сөз *',
      confirmPassword: 'Құпия сөзді растау *',
      register: 'Тіркелу',
      registering: 'Тіркелу...',
      haveAccount: 'Аккаунтыңыз бар ма?',
      login: 'Кіру',
      back: 'Басты бетке',
      errorPasswordMatch: 'Құпия сөздер сәйкес келмейді',
      errorPasswordLength: 'Құпия сөз кемінде 6 таңба болуы керек',
      errorCarModel: 'Көлік моделін көрсетіңіз',
      errorConnection: 'Сервермен байланыс қатесі',
      errorRegistration: 'Тіркеу қатесі',
      successTitle: 'Өтініш жіберілді!',
      successText: 'Курьер ретінде тіркелу өтінішіңіз қарауға жіберілді.',
      dashboard: 'Курьер панеліне'
    },
    ru: {
      title: 'Регистрация курьера',
      subtitle: 'Выберите тип доставки',
      firstName: 'Имя *',
      lastName: 'Фамилия *',
      courierType: 'Тип курьера *',
      pedestrian: 'Пеший',
      pedestrianRadius: 'Радиус 3 км',
      driver: 'На машине',
      driverRadius: 'Радиус 15 км',
      carModel: 'Модель автомобиля',
      carNumber: 'Госномер',
      phone: 'Телефон *',
      password: 'Пароль *',
      confirmPassword: 'Подтверждение пароля *',
      register: 'Зарегистрироваться',
      registering: 'Регистрация...',
      haveAccount: 'Уже есть аккаунт?',
      login: 'Войти',
      back: 'На главную',
      errorPasswordMatch: 'Пароли не совпадают',
      errorPasswordLength: 'Пароль должен быть не менее 6 символов',
      errorCarModel: 'Укажите модель автомобиля',
      errorConnection: 'Ошибка соединения с сервером',
      errorRegistration: 'Ошибка регистрации',
      successTitle: 'Заявка отправлена!',
      successText: 'Ваша заявка на регистрацию курьера отправлена на рассмотрение.',
      dashboard: 'В панель курьера'
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirm_password) {
      setError(t[lang].errorPasswordMatch);
      return;
    }
    
    if (formData.password.length < 6) {
      setError(t[lang].errorPasswordLength);
      return;
    }
    
    if (formData.courier_type === 'driver' && !formData.car_model) {
      setError(t[lang].errorCarModel);
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch(`/courier/register`, {
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
        setError(data.detail || t[lang].errorRegistration);
      }
    } catch (err) {
      setError(t[lang].errorConnection);
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t[lang].successTitle}</h1>
          <p className="text-gray-400 text-sm mb-6">{t[lang].successText}</p>
          <Link href="/courier/dashboard">
            <button className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20">
              {t[lang].dashboard}
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
            <h1 className="text-2xl font-bold text-gray-800">{t[lang].title}</h1>
            <p className="text-gray-400 text-sm mt-1">{t[lang].subtitle}</p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-200">
              ❌ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t[lang].firstName}</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
            </div>
            
            {/* Фамилия */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t[lang].lastName}</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>
            
            {/* Тип курьера */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">{t[lang].courierType}</label>
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
                  <Footprints size={28} className={`mx-auto mb-1 ${formData.courier_type === 'pedestrian' ? 'text-emerald-600/60' : 'text-gray-400/50'}`} strokeWidth={1.5} />
                  <div className="text-sm font-medium text-gray-700">{t[lang].pedestrian}</div>
                  <div className="text-xs text-gray-400 mt-1">{t[lang].pedestrianRadius}</div>
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
                  <Car size={28} className={`mx-auto mb-1 ${formData.courier_type === 'driver' ? 'text-emerald-600/60' : 'text-gray-400/50'}`} strokeWidth={1.5} />
                  <div className="text-sm font-medium text-gray-700">{t[lang].driver}</div>
                  <div className="text-xs text-gray-400 mt-1">{t[lang].driverRadius}</div>
                </button>
              </div>
            </div>
            
            {/* Поля для водителя */}
            {formData.courier_type === 'driver' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{t[lang].carModel}</label>
                  <div className="relative">
                    <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" strokeWidth={1.5} />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                      value={formData.car_model}
                      onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{t[lang].carNumber}</label>
                  <div className="relative">
                    <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" strokeWidth={1.5} />
                    <input
                      type="text"
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
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t[lang].phone}</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" strokeWidth={1.5} />
                <input
                  type="tel"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            
            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t[lang].password}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition placeholder:text-gray-400/60"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            
            {/* Подтверждение пароля */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">{t[lang].confirmPassword}</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400/50" strokeWidth={1.5} />
                <input
                  type="password"
                  required
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
                  {t[lang].registering}
                </span>
              ) : t[lang].register}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              {t[lang].haveAccount}{' '}
              <Link href="/courier/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition">
                {t[lang].login}
              </Link>
            </p>
          </div>
          
          <div className="text-center mt-4">
            <Link href="/" className="text-xs text-gray-300 hover:text-gray-500 transition inline-flex items-center gap-1">
              <ArrowLeft size={12} className="opacity-50" />
              {t[lang].back}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}