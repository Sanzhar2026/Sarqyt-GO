'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'code' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // ======== ШАГ 1: ВВОД ТЕЛЕФОНА ========
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!phone) {
      setError('Введите номер телефона');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedCode(data.debug_code);
        setStep('code');
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
        setError(data.message || 'Ошибка отправки кода');
        setLoading(false);
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  // ======== ШАГ 2: ПРОВЕРКА КОДА ========
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!code || code.length !== 6) {
      setError('Введите 6-значный код');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          code: code,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResetToken(data.reset_token);
        setStep('reset');
        setLoading(false);
      } else {
        setError(data.message || 'Неверный код');
        setLoading(false);
      }
    } catch (error) {
      setError('Ошибка проверки кода');
      setLoading(false);
    }
  };

  // ======== ШАГ 3: УСТАНОВКА НОВОГО ПАРОЛЯ ========
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          code: code,
          new_password: newPassword,
          reset_token: resetToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        setError(data.message || 'Ошибка сброса пароля');
        setLoading(false);
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  // ======== ПОВТОРНАЯ ОТПРАВКА КОДА ========
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGeneratedCode(data.debug_code);
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
        setError(data.message || 'Ошибка отправки кода');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  // ============================================================
  // ШАГ 1: ВВОД ТЕЛЕФОНА
  // ============================================================
  if (step === 'phone') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#367666]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-[#367666]">🔑</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Восстановление пароля</h1>
              <p className="text-gray-500 text-sm mt-1">Введите номер телефона для восстановления</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#367666] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#2a5a4d] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Отправка...
                  </span>
                ) : 'Отправить код'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <span className="text-sm text-gray-500">Вспомнили пароль? </span>
              <Link href="/login" className="text-sm text-[#367666] font-semibold hover:underline">
                Войти
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ШАГ 2: ВВОД КОДА
  // ============================================================
  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#367666]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-[#367666]">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Подтверждение</h1>
              <p className="text-gray-500 text-sm mt-1">Введите код, отправленный на номер</p>
              <p className="text-gray-700 font-semibold text-sm mt-1">{phone}</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 text-center">
                  Код подтверждения
                </label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="— — — — — —" 
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-center text-3xl tracking-[1.5rem] font-mono" 
                  required 
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-gray-400 text-center mt-2">
                  {code.length === 0 ? 'Введите 6 цифр' : `${code.length} / 6`}
                </p>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Ваш код подтверждения:</p>
                <p className="text-2xl font-mono font-bold text-[#367666] tracking-[0.5rem]">
                  {generatedCode}
                </p>
              </div>
              
              <button 
                type="submit" 
                disabled={loading || code.length !== 6} 
                className="w-full bg-[#367666] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#2a5a4d] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Проверка...
                  </span>
                ) : 'Подтвердить'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button 
                onClick={handleResendCode}
                disabled={resendTimer > 0}
                className="text-sm text-[#367666] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendTimer > 0 
                  ? `Отправить повторно через ${resendTimer}с` 
                  : 'Отправить код повторно'}
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep('phone')}
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
  // ШАГ 3: УСТАНОВКА НОВОГО ПАРОЛЯ
  // ============================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-[#367666]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-[#367666]">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Новый пароль</h1>
            <p className="text-gray-500 text-sm mt-1">Введите новый пароль</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-2xl text-sm border border-green-100">
              Пароль успешно изменен! Перенаправление на вход...
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Новый пароль
              </label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Минимум 6 символов" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                required 
                minLength={6}
                disabled={success}
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
                disabled={success}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || success} 
              className="w-full bg-[#367666] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#2a5a4d] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Сохранение...
                </span>
              ) : 'Сохранить пароль'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/login" className="text-sm text-[#367666] font-semibold hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}