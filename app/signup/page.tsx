// app/signup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../components/Logo';

type Language = 'kz' | 'ru';

export default function SignupPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('kz');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const t = {
    kz: {
      title: 'Тіркелу',
      subtitle: 'Жаңа аккаунт жасаңыз',
      phone: 'Телефон нөмірі',
      phonePlaceholder: '+77071234567',
      code: 'SMS код',
      firstName: 'Аты',
      lastName: 'Тегі',
      password: 'Құпия сөз',
      confirmPassword: 'Құпия сөзді растаңыз',
      sendCode: 'Код жіберу',
      signup: 'Тіркелу',
      haveAccount: 'Аккаунтыңыз бар ма?',
      login: 'Кіру',
      demoCode: 'Демо режим: Код 123456',
      invalidCode: 'Қате код',
      passwordMismatch: 'Құпия сөздер сәйкес келмейді',
    },
    ru: {
      title: 'Регистрация',
      subtitle: 'Создайте новый аккаунт',
      phone: 'Номер телефона',
      phonePlaceholder: '+77071234567',
      code: 'SMS код',
      firstName: 'Имя',
      lastName: 'Фамилия',
      password: 'Пароль',
      confirmPassword: 'Подтвердите пароль',
      sendCode: 'Отправить код',
      signup: 'Зарегистрироваться',
      haveAccount: 'Уже есть аккаунт?',
      login: 'Войти',
      demoCode: 'Демо режим: Код 123456',
      invalidCode: 'Неверный код',
      passwordMismatch: 'Пароли не совпадают',
    },
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('7') && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+77${digits}`;
    if (digits.startsWith('8') && digits.length === 11) return `+7${digits.slice(1)}`;
    return value;
  };

  const toggleLanguage = () => {
    setLang(lang === 'kz' ? 'ru' : 'kz');
    setError('');
  };

  const sendVerification = async () => {
    if (!phone) {
      setError(t[lang].phone + ' ' + (lang === 'kz' ? 'қажет' : 'обязателен'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const response = await fetch(`${API_URL}/api/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formattedPhone }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsDemoMode(data.demo || false);
        if (data.demo) setVerificationCode('123456');
        setStep('verify');
      } else {
        setError(data.detail || 'Ошибка отправки SMS');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError(t[lang].passwordMismatch);
      return;
    }
    if (password.length < 4) {
      setError(lang === 'kz' ? 'Құпия сөз кемінде 4 символ' : 'Пароль не менее 4 символов');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Имя и фамилия обязательны');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const codeToSend = isDemoMode ? '123456' : verificationCode;
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const response = await fetch(`${API_URL}/api/verify-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: formattedPhone,
          full_name: fullName,
          password: password,
          verification_code: codeToSend,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Сохраняем в localStorage
        localStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          name: fullName,
          full_name: fullName,
          phone: formattedPhone
        }));
        
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        
        localStorage.setItem('isLoggedIn', 'true');
        
        window.dispatchEvent(new Event('authUpdated'));
        window.location.href = '/';
      } else {
        setError(data.detail || t[lang].invalidCode);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={toggleLanguage} className={`px-4 py-2 rounded-full text-sm font-medium transition ${lang === 'kz' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'}`}>Қаз</button>
        <button onClick={toggleLanguage} className={`px-4 py-2 rounded-full text-sm font-medium transition ${lang === 'ru' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'}`}>Рус</button>
      </div>

      <div className="flex flex-col items-center justify-center pt-12 pb-6">
        <Logo size="large" showText={true} />
      </div>

      <div className="px-6 pb-12">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{t[lang].title}</h2>
          <p className="text-center text-gray-500 text-sm mb-8">{t[lang].subtitle}</p>

          {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">{error}</div>}
          {isDemoMode && step === 'verify' && <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-xl text-sm border border-yellow-200">{t[lang].demoCode}</div>}

          {step === 'phone' ? (
            <div className="space-y-5">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].phone}</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t[lang].phonePlaceholder} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" /></div>
              <button onClick={sendVerification} disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition disabled:opacity-70 shadow-md">{loading ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{lang === 'kz' ? 'Жіберілуде...' : 'Отправка...'}</span> : t[lang].sendCode}</button>
            </div>
          ) : (
            <div className="space-y-4">
              {!isDemoMode && (<div><label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].code}</label><input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="123456" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" /></div>)}
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].firstName}</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={lang === 'kz' ? 'Атыңыз' : 'Ваше имя'} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].lastName}</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={lang === 'kz' ? 'Тегіңіз' : 'Ваша фамилия'} className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].password}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">{t[lang].confirmPassword}</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition" /></div>
              <button onClick={handleSignup} disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg mt-4 hover:bg-emerald-700 transition disabled:opacity-70 shadow-md">{loading ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{lang === 'kz' ? 'Тіркелу...' : 'Регистрация...'}</span> : t[lang].signup}</button>
            </div>
          )}

          <p className="text-center text-gray-500 mt-8">{t[lang].haveAccount} <Link href="/login" className="text-emerald-600 font-semibold hover:underline">{t[lang].login}</Link></p>
        </div>
      </div>
    </div>
  );
}