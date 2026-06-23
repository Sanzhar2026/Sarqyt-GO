// app/courier/register/page.tsx - СТИЛЬ YANDEX PRO + ЗЕЛЕНЫЙ

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
  CheckCircle,
  ChevronRight,
  MapPin,
  Clock,
  Star
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
  const [step, setStep] = useState<'phone' | 'form'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const t = {
    kz: {
      title: 'Курьер болыңыз да, табыс табыңыз',
      subtitle: 'Икемді кесте • Жоғары табыс • Бонустар',
      phone: 'Телефон нөміріңіз',
      continue: 'Жалғастыру',
      firstName: 'Аты *',
      lastName: 'Тегі *',
      courierType: 'Курьер түрі *',
      pedestrian: 'Жаяу',
      pedestrianRadius: 'Радиус 3 км',
      driver: 'Көлікпен',
      driverRadius: 'Радиус 15 км',
      carModel: 'Көлік моделі',
      carNumber: 'Мемлекеттік нөмір',
      password: 'Құпия сөз *',
      confirmPassword: 'Құпия сөзді растау *',
      register: 'Курьер болып істеу',
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
      dashboard: 'Курьер панеліне',
      benefits: 'Курьер болудың артықшылықтары',
      flexibleSchedule: 'Икемді кесте',
      highEarnings: 'Жоғары табыс',
      bonuses: 'Бонустар мен сыйлықтар'
    },
    ru: {
      title: 'Станьте курьером и зарабатывайте',
      subtitle: 'Гибкий график • Высокий доход • Бонусы',
      phone: 'Ваш номер телефона',
      continue: 'Продолжить',
      firstName: 'Имя *',
      lastName: 'Фамилия *',
      courierType: 'Тип курьера *',
      pedestrian: 'Пеший',
      pedestrianRadius: 'Радиус 3 км',
      driver: 'На машине',
      driverRadius: 'Радиус 15 км',
      carModel: 'Модель автомобиля',
      carNumber: 'Госномер',
      password: 'Пароль *',
      confirmPassword: 'Подтверждение пароля *',
      register: 'Работать курьером',
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
      dashboard: 'В панель курьера',
      benefits: 'Преимущества работы курьером',
      flexibleSchedule: 'Гибкий график',
      highEarnings: 'Высокий доход',
      bonuses: 'Бонусы и поощрения'
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }
    setError('');
    setStep('form');
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
      const res = await fetch(`/api/courier/register`, {
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
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t[lang].successTitle}</h1>
          <p className="text-gray-500 mb-8">{t[lang].successText}</p>
          <Link href="/courier/dashboard">
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg transition shadow-lg shadow-emerald-600/30">
              {t[lang].dashboard}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Truck size={20} className="text-emerald-600" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">Sarqyn</div>
              <div className="text-xs text-gray-400 -mt-0.5">Курьер</div>
            </div>
          </div>
          <div className="text-emerald-600 text-sm font-medium">🇰🇿</div>
        </div>
      </div>

      <div className="max-w-md mx-auto pb-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-6 pt-10 pb-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold leading-tight mb-3">
              {t[lang].title}
            </h1>
            <p className="text-emerald-100 text-lg opacity-90">{t[lang].subtitle}</p>
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="px-6 -mt-8 relative z-10">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Clock size={18} className="text-emerald-600" strokeWidth={1.5} />
              </div>
              <div className="text-xs font-medium text-gray-700">{t[lang].flexibleSchedule}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Star size={18} className="text-emerald-600" strokeWidth={1.5} />
              </div>
              <div className="text-xs font-medium text-gray-700">{t[lang].highEarnings}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                <Truck size={18} className="text-emerald-600" strokeWidth={1.5} />
              </div>
              <div className="text-xs font-medium text-gray-700">{t[lang].bonuses}</div>
            </div>
          </div>
        </div>

        {/* Форма */}
        <div className="px-6 mt-6">
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t[lang].phone}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+7</div>
                  <input
                    type="tel"
                    required
                    placeholder="(000) 000-00-00"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                {t[lang].continue}
                <ChevronRight size={20} strokeWidth={2} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                {/* Имя */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t[lang].firstName}</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                </div>

                {/* Фамилия */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t[lang].lastName}</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                    <input
                      type="text"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>
                </div>

                {/* Тип курьера */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t[lang].courierType}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, courier_type: 'pedestrian', car_model: '', car_number: ''})}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        formData.courier_type === 'pedestrian' 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <Footprints size={28} className={`mx-auto mb-1 ${formData.courier_type === 'pedestrian' ? 'text-emerald-600' : 'text-gray-400'}`} strokeWidth={1.5} />
                      <div className="text-sm font-medium text-gray-700">{t[lang].pedestrian}</div>
                      <div className="text-xs text-gray-400 mt-1">{t[lang].pedestrianRadius}</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, courier_type: 'driver'})}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        formData.courier_type === 'driver' 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <Car size={28} className={`mx-auto mb-1 ${formData.courier_type === 'driver' ? 'text-emerald-600' : 'text-gray-400'}`} strokeWidth={1.5} />
                      <div className="text-sm font-medium text-gray-700">{t[lang].driver}</div>
                      <div className="text-xs text-gray-400 mt-1">{t[lang].driverRadius}</div>
                    </button>
                  </div>
                </div>

                {/* Поля для водителя */}
                {formData.courier_type === 'driver' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t[lang].carModel}</label>
                      <div className="relative">
                        <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                        <input
                          type="text"
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                          value={formData.car_model}
                          onChange={(e) => setFormData({...formData, car_model: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{t[lang].carNumber}</label>
                      <div className="relative">
                        <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                        <input
                          type="text"
                          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                          value={formData.car_number}
                          onChange={(e) => setFormData({...formData, car_number: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Телефон */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t[lang].phone}</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                    <input
                      type="tel"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                {/* Пароль */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t[lang].password}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                    <input
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                {/* Подтверждение пароля */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t[lang].confirmPassword}</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
                    <input
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t[lang].registering}
                  </>
                ) : (
                  t[lang].register
                )}
              </button>
            </form>
          )}

          {/* Footer Links */}
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

          <div className="text-center text-xs text-gray-400 mt-8">
            SMS немесе WhatsApp арқылы келген кодпен тіркеліңіз
          </div>
        </div>
      </div>
    </div>
  );
}