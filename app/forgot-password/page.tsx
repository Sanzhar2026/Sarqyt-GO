'use client';

import { useState, useEffect } from 'react';
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
  const [resetToken, setResetToken] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [cooldownTimer, setCooldownTimer] = useState(0);

  // ======== ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ ПРИ ЗАГРУЗКЕ ========
  useEffect(() => {
    const savedStep = sessionStorage.getItem('reset_step');
    const savedPhone = sessionStorage.getItem('reset_phone');
    const savedCode = sessionStorage.getItem('reset_code');
    const savedToken = sessionStorage.getItem('reset_token');
    const savedResendTimer = sessionStorage.getItem('reset_resend_timer');
    const savedCooldownTimer = sessionStorage.getItem('reset_cooldown_timer');
    const savedTimerStart = sessionStorage.getItem('reset_timer_start');
    
    if (savedStep) setStep(savedStep as 'phone' | 'code' | 'reset');
    if (savedPhone) setPhone(savedPhone);
    if (savedCode) setCode(savedCode);
    if (savedToken) setResetToken(savedToken);
    
    // ✅ ВОССТАНОВЛЕНИЕ ТАЙМЕРОВ
    if (savedResendTimer) {
      const saved = parseInt(savedResendTimer);
      const start = parseInt(savedTimerStart || '0');
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, saved - elapsed);
      setResendTimer(remaining);
      
      // Если осталось время - запускаем таймер
      if (remaining > 0) {
        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              sessionStorage.removeItem('reset_resend_timer');
              sessionStorage.removeItem('reset_timer_start');
              return 0;
            }
            const newVal = prev - 1;
            sessionStorage.setItem('reset_resend_timer', String(newVal));
            return newVal;
          });
        }, 1000);
      }
    }
    
    if (savedCooldownTimer) {
      const saved = parseInt(savedCooldownTimer);
      const start = parseInt(sessionStorage.getItem('reset_cooldown_start') || '0');
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, saved - elapsed);
      setCooldownTimer(remaining);
      
      if (remaining > 0) {
        const interval = setInterval(() => {
          setCooldownTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              sessionStorage.removeItem('reset_cooldown_timer');
              sessionStorage.removeItem('reset_cooldown_start');
              return 0;
            }
            const newVal = prev - 1;
            sessionStorage.setItem('reset_cooldown_timer', String(newVal));
            return newVal;
          });
        }, 1000);
      }
    }
  }, []);

  // ======== СОХРАНЕНИЕ СОСТОЯНИЯ ========
  useEffect(() => {
    sessionStorage.setItem('reset_step', step);
    sessionStorage.setItem('reset_phone', phone);
    sessionStorage.setItem('reset_code', code);
    sessionStorage.setItem('reset_token', resetToken);
  }, [step, phone, code, resetToken]);

  const startCooldown = () => {
    setCooldownTimer(60);
    sessionStorage.setItem('reset_cooldown_timer', '60');
    sessionStorage.setItem('reset_cooldown_start', String(Date.now()));
    
    const interval = setInterval(() => {
      setCooldownTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem('reset_cooldown_timer');
          sessionStorage.removeItem('reset_cooldown_start');
          return 0;
        }
        const newVal = prev - 1;
        sessionStorage.setItem('reset_cooldown_timer', String(newVal));
        return newVal;
      });
    }, 1000);
  };

  const startResendTimer = () => {
    setResendTimer(60);
    sessionStorage.setItem('reset_resend_timer', '60');
    sessionStorage.setItem('reset_timer_start', String(Date.now()));
    
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem('reset_resend_timer');
          sessionStorage.removeItem('reset_timer_start');
          return 0;
        }
        const newVal = prev - 1;
        sessionStorage.setItem('reset_resend_timer', String(newVal));
        return newVal;
      });
    }, 1000);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cooldownTimer > 0) {
      setError(`Подождите ${cooldownTimer} секунд перед повторной отправкой`);
      return;
    }
    
    setLoading(true);
    setError('');

    if (!phone) {
      setError('Введите номер телефона');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLoading(false);
        setError('');
        
        startCooldown();
        setStep('code');
        startResendTimer();
        
      } else {
        setError(data.message || 'Ошибка отправки запроса');
        setLoading(false);
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

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
      const response = await fetch('/api/auth/verify-reset-code', {
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
      const response = await fetch('/api/auth/reset-password', {
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
        
        // ОЧИСТКА
        sessionStorage.removeItem('reset_step');
        sessionStorage.removeItem('reset_phone');
        sessionStorage.removeItem('reset_code');
        sessionStorage.removeItem('reset_token');
        sessionStorage.removeItem('reset_resend_timer');
        sessionStorage.removeItem('reset_cooldown_timer');
        sessionStorage.removeItem('reset_timer_start');
        sessionStorage.removeItem('reset_cooldown_start');
        
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

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    if (cooldownTimer > 0) {
      setError(`Подождите ${cooldownTimer} секунд`);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setError('');
        startCooldown();
        startResendTimer();
      } else {
        setError(data.message || 'Ошибка отправки кода');
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    }
  };

  const handleBack = () => {
    setStep('phone');
    sessionStorage.removeItem('reset_step');
    sessionStorage.removeItem('reset_phone');
    sessionStorage.removeItem('reset_code');
    sessionStorage.removeItem('reset_token');
    sessionStorage.removeItem('reset_resend_timer');
    sessionStorage.removeItem('reset_cooldown_timer');
    sessionStorage.removeItem('reset_timer_start');
    sessionStorage.removeItem('reset_cooldown_start');
  };

  if (step === 'phone') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-[#367666]">
                Восстановление пароля
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Введите номер телефона для восстановления
              </p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || cooldownTimer > 0} 
                className="w-full bg-[#367666] text-white py-3 rounded-xl font-medium text-base hover:bg-[#2a5a4d] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Отправка...' : cooldownTimer > 0 ? `Подождите ${cooldownTimer}с` : 'Отправить запрос'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <span className="text-sm text-gray-500">Вспомнили пароль? </span>
              <Link href="/login" className="text-sm text-[#367666] font-medium hover:underline">
                Войти
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-[#367666]">
                Подтверждение
              </h1>
              <p className="text-gray-500 text-sm mt-2">
                Введите код, отправленный на ваш номер
              </p>
              <p className="text-gray-700 font-medium text-sm mt-1">
                {phone}
              </p>
              {!error && (
                <div className="mt-3 p-3 bg-gray-50 text-gray-600 rounded-xl text-sm border border-gray-200">
                  Ожидайте одобрения администратора. Код придет после подтверждения.
                </div>
              )}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Код подтверждения
                </label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="Введите код" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-center text-2xl tracking-[0.5rem] font-mono" 
                  required 
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || code.length !== 6} 
                className="w-full bg-[#367666] text-white py-3 rounded-xl font-medium text-base hover:bg-[#2a5a4d] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button 
                onClick={handleResendCode}
                disabled={resendTimer > 0 || cooldownTimer > 0}
                className="text-sm text-[#367666] hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldownTimer > 0 
                  ? `Подождите ${cooldownTimer}с` 
                  : resendTimer > 0 
                    ? `Отправить повторно через ${resendTimer}с` 
                    : 'Отправить код повторно'}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleBack}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[#367666]">
              Новый пароль
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Введите новый пароль
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm border border-green-200">
              Пароль успешно изменен
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
                placeholder="Пароль" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
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
                placeholder="Подтвердите пароль" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base" 
                required 
                minLength={6}
                disabled={success}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || success} 
              className="w-full bg-[#367666] text-white py-3 rounded-xl font-medium text-base hover:bg-[#2a5a4d] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/login" className="text-sm text-[#367666] font-medium hover:underline">
              Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}