// app/login/page.tsx - ПОЛНАЯ ВЕРСИЯ С ВОССТАНОВЛЕНИЕМ ПАРОЛЯ

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Состояния для восстановления пароля
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetStep, setResetStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [resetToken, setResetToken] = useState('');

  const API_URL = 'https://toogood-2ncf.onrender.com';
  const MAX_CODE_LENGTH = 6;

  // Таймер
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ✅ ОБЫЧНЫЙ ВХОД
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        sessionStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          name: data.user.full_name,
          full_name: data.user.full_name,
          phone: data.user.phone,
          role: data.user.role || 'customer'
        }));
        
        if (data.token) {
          sessionStorage.setItem('userToken', data.token);
        }
        
        sessionStorage.setItem('isLoggedIn', 'true');
        
        const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        
        window.location.href = redirectTo;
      } else {
        setError(data.error || 'Неверный телефон или пароль');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Неверный телефон или пароль');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ЗАПРОС ВОССТАНОВЛЕНИЯ
  const handleRequestReset = async () => {
    if (!phone || phone.length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResetStep('code');
        setCountdown(60);
        setError('');
        alert(`✅ Код отправлен на номер ${phone}\nКод: ${data.debug_code || '******'}`);
      } else {
        setError(data.message || 'Ошибка отправки');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ПРОВЕРКА КОДА
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== MAX_CODE_LENGTH) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          code: verificationCode 
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResetToken(data.reset_token || '');
        setResetStep('password');
        setError('');
      } else {
        setError(data.message || 'Неверный код');
      }
    } catch (error) {
      console.error('Verify error:', error);
      setError('Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  // ✅ СБРОС ПАРОЛЯ
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          code: verificationCode,
          new_password: newPassword,
          reset_token: resetToken
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('✅ Пароль успешно изменен! Войдите с новым паролем.');
        // Возвращаемся к обычному входу
        setShowResetForm(false);
        setResetStep('phone');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
        setError('');
      } else {
        setError(data.message || 'Ошибка сброса пароля');
      }
    } catch (error) {
      console.error('Reset error:', error);
      setError('Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  // Форматирование ввода кода
  const handleCodeInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, MAX_CODE_LENGTH);
    setVerificationCode(digits);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-8">
            {showResetForm ? 'Восстановление пароля' : 'Войти'}
          </h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {!showResetForm ? (
            // ✅ ОБЫЧНЫЙ ВХОД
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Номер телефона</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+77071234567" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                  required 
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
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg mt-6 hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Вход...
                  </span>
                ) : 'Войти'}
              </button>

              {/* ✅ ЗАБЫЛИ ПАРОЛЬ? */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(true);
                    setResetStep('phone');
                    setError('');
                  }}
                  className="text-sm text-[#367666] hover:underline font-medium"
                >
                  Забыли пароль?
                </button>
              </div>
            </form>
          ) : (
            // ✅ ВОССТАНОВЛЕНИЕ ПАРОЛЯ
            <div className="space-y-5">
              {resetStep === 'phone' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Номер телефона</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+77071234567" 
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                      required 
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      На этот номер будет отправлен код подтверждения
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleRequestReset}
                    disabled={loading || countdown > 0}
                    className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Отправка...
                      </span>
                    ) : countdown > 0 ? (
                      `Повторить через ${countdown}с`
                    ) : (
                      'Получить код'
                    )}
                  </button>
                </>
              )}

              {resetStep === 'code' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Введите код из SMS
                    </label>
                    <input 
                      type="text" 
                      value={verificationCode} 
                      onChange={(e) => handleCodeInput(e.target.value)} 
                      placeholder="000000" 
                      maxLength={6}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition text-center text-2xl tracking-[0.5em] font-mono"
                      required 
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-400">
                      <span>Код отправлен на {phone}</span>
                      {countdown > 0 && <span>Действителен {countdown}с</span>}
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={loading || verificationCode.length !== MAX_CODE_LENGTH}
                    className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Проверка...
                      </span>
                    ) : 'Подтвердить код'}
                  </button>
                </>
              )}

              {resetStep === 'password' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Новый пароль</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="•••••••• (минимум 6 символов)" 
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                      required 
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
                      required 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Сохранение...
                      </span>
                    ) : 'Сохранить пароль'}
                  </button>
                </>
              )}

              {/* Кнопка "Назад" */}
              <button
                type="button"
                onClick={() => {
                  if (resetStep === 'phone') {
                    setShowResetForm(false);
                  } else if (resetStep === 'code') {
                    setResetStep('phone');
                    setVerificationCode('');
                  } else {
                    setResetStep('code');
                    setNewPassword('');
                    setConfirmPassword('');
                  }
                  setError('');
                }}
                className="text-sm text-gray-400 hover:text-gray-600 underline text-center w-full"
              >
                ← Назад
              </button>
            </div>
          )}

          <p className="text-center text-gray-500 mt-8">
            Нет аккаунта? <Link href="/signup" className="text-[#367666] font-semibold hover:underline">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
}