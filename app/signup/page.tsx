'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // ✅ ТВОЙ БЕКЕНД НА RAILWAY
  const API_URL = 'https://toogood-2ncf.onrender.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!firstName || !lastName) {
      setError('Введите имя и фамилию');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      setLoading(false);
      return;
    }

    if (!phone) {
      setError('Введите номер телефона');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserId(data.user_id);
        setGeneratedCode(data.code);
        setStep('verify');
        setLoading(false);
        
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        setError(data.detail || 'Ошибка регистрации');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    setError('');

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Введите 6-значный код подтверждения');
      setVerifyLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          phone: phone,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        
        if (data.token) {
          localStorage.setItem('userToken', data.token);
          sessionStorage.setItem('userToken', data.token);
        }
        
        if (data.user) {
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }
        
        sessionStorage.setItem('isLoggedIn', 'true');
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
        
      } else {
        setError(data.detail || 'Неверный код подтверждения');
        setVerifyLoading(false);
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      setError('Ошибка проверки кода');
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGeneratedCode(data.code);
        setError('');
        
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        setError(data.detail || 'Ошибка отправки кода');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      setError('Ошибка подключения к серверу');
    }
  };

  // ============================================================
  // ШАГ 2: ВВОД КОДА
  // ============================================================
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-[#367666]">
                Подтверждение
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Введите код, отправленный на номер
              </p>
              <p className="text-gray-700 font-medium text-sm mt-1">
                {phone}
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm border border-green-200">
                Регистрация успешна
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Код подтверждения
                </label>
                <input 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-center text-2xl tracking-[0.5rem] font-mono" 
                  required 
                  maxLength={6}
                  disabled={success}
                  autoFocus
                />
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Ваш код:</p>
                <p className="text-2xl font-mono font-bold text-[#367666] tracking-[0.5rem]">
                  {generatedCode}
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={verifyLoading || success || verificationCode.length !== 6} 
                className="w-full bg-[#367666] text-white py-3 rounded-xl font-medium text-base hover:bg-[#2a5a4d] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyLoading ? 'Проверка...' : 'Подтвердить'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button 
                onClick={handleResendCode}
                disabled={resendTimer > 0 || success}
                className="text-sm text-[#367666] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendTimer > 0 
                  ? `Отправить повторно через ${resendTimer}с` 
                  : 'Отправить код повторно'}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setStep('register')}
                className="text-center text-gray-400 text-sm hover:text-gray-600 transition w-full"
              >
                Назад
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ШАГ 1: ФОРМА РЕГИСТРАЦИИ
  // ============================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[#367666]">
              Регистрация
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Заполните данные для создания аккаунта
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Имя
              </label>
              <input 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Имя" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Фамилия
              </label>
              <input 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Фамилия" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Номер телефона
              </label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+7 777 777 77 77" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Пароль
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Пароль" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
                required 
                minLength={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Подтвердите пароль
              </label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Подтвердите пароль" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
                required 
                minLength={6}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#367666] text-white py-3 rounded-xl font-medium text-base mt-2 hover:bg-[#2a5a4d] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-sm text-gray-500">Уже есть аккаунт? </span>
            <Link href="/login" className="text-sm text-[#367666] font-medium hover:underline">
              Войти
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}