'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('7') && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+77${digits}`;
    if (digits.startsWith('8') && digits.length === 11) return `+7${digits.slice(1)}`;
    return value;
  };

  const sendVerification = async () => {
    if (!phone) {
      setError('Номер телефона обязателен');
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
      setError('Пароли не совпадают');
      return;
    }
    if (password.length < 4) {
      setError('Пароль не менее 4 символов');
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
        sessionStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          name: fullName,
          full_name: fullName,
          phone: formattedPhone
        }));
        
        if (data.token) {
          sessionStorage.setItem('authToken', data.token);
        }
        
        sessionStorage.setItem('isLoggedIn', 'true');
        
        window.dispatchEvent(new Event('authUpdated'));
        window.location.href = '/';
      } else {
        setError(data.detail || 'Неверный код подтверждения');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-8">Регистрация</h1>
          
          {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">{error}</div>}
          {isDemoMode && step === 'verify' && <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-xl text-sm border border-yellow-200">Демо режим: Код 123456</div>}

          {step === 'phone' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Номер телефона</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+77071234567" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                />
              </div>
              <button 
                onClick={sendVerification} 
                disabled={loading} 
                className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Отправка...
                  </span>
                ) : 'Отправить код'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!isDemoMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMS код</label>
                  <input 
                    type="text" 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)} 
                    placeholder="123456" 
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="Ваше имя" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  placeholder="Ваша фамилия" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подтвердите пароль</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                />
              </div>
              <button 
                onClick={handleSignup} 
                disabled={loading} 
                className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg mt-4 hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Регистрация...
                  </span>
                ) : 'Зарегистрироваться'}
              </button>
            </div>
          )}

          <p className="text-center text-gray-500 mt-8">
            Уже есть аккаунт? <Link href="/login" className="text-[#367666] font-semibold hover:underline">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}