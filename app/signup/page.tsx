// app/signup/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  // ======== ШАГ 1: РЕГИСТРАЦИЯ ========
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // ======== ШАГ 2: ВЕРИФИКАЦИЯ ========
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // ======== ОТПРАВКА РЕГИСТРАЦИИ ========
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
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  // ======== ПРОВЕРКА КОДА ========
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
      setError('Ошибка проверки кода');
      setVerifyLoading(false);
    }
  };

  // ======== ПОВТОРНАЯ ОТПРАВКА КОДА ========
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
      setError('Ошибка подключения к серверу');
    }
  };

  // ============================================================
  // ШАГ 2: ВВОД КОДА ПОДТВЕРЖДЕНИЯ
  // ============================================================
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#367666]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-[#367666]">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Подтверждение номера
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Введите код, отправленный на номер
              </p>
              <p className="text-gray-700 font-semibold text-sm mt-1">
                {phone}
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-2xl text-sm border border-green-100">
                Регистрация успешна. Перенаправление...
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Код подтверждения
                </label>
                <input 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="— — — — — —" 
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-center text-3xl tracking-[1.5rem] font-mono" 
                  required 
                  maxLength={6}
                  disabled={success}
                  autoFocus
                />
                <p className="text-xs text-gray-400 text-center mt-2">
                  {verificationCode.length === 0 ? 'Введите 6 цифр' : `${verificationCode.length} / 6`}
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={verifyLoading || success || verificationCode.length !== 6} 
                className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#2a5a4d] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {verifyLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Проверка...
                  </span>
                ) : 'Подтвердить'}
              </button>
            </form>

            <div className="mt-5 text-center">
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

            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep('register')}
                className="text-center text-gray-400 text-sm hover:text-gray-600 transition w-full"
              >
                Назад к регистрации
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#367666] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl text-white">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Создать аккаунт</h1>
            <p className="text-gray-500 text-sm mt-1">Заполните данные для регистрации</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Имя
                </label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  placeholder="Иван" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
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
                  placeholder="Иванов" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                  required 
                />
              </div>
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
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
                placeholder="Минимум 6 символов" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
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
                placeholder="Повторите пароль" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                required 
                minLength={6}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#367666] text-white py-3.5 rounded-xl font-semibold text-base mt-2 hover:bg-[#2a5a4d] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Регистрация...
                </span>
              ) : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-sm text-gray-500">Уже есть аккаунт? </span>
            <Link href="/login" className="text-sm text-[#367666] font-semibold hover:underline">
              Войти
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}