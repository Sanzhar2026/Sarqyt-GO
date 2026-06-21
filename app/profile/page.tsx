// app/signup/page.tsx - С ВЕРИФИКАЦИЕЙ

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://toogood-production.up.railway.app';

  // Генерация 6-значного кода
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Шаг 1: Отправка номера
  const sendVerification = async () => {
    if (!phone) {
      setError('Номер телефона обязателен');
      return;
    }
    
    const code = generateCode();
    setGeneratedCode(code);
    setVerificationCode(code);
    
    alert(`✅ Ваш код подтверждения: ${code}`);
    
    setStep('verify');
    setError('');
  };

  // Шаг 2: Регистрация
  const handleSignup = async () => {
    if (!fullName) {
      setError('Введите полное имя');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    
    if (password.length < 4) {
      setError('Пароль не менее 4 символов');
      return;
    }
    
    if (verificationCode !== generatedCode) {
      setError('Неверный код подтверждения');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/verify-and-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim(),
          full_name: fullName.trim(),
          password: password,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('userToken', data.token);
          sessionStorage.setItem('userToken', data.token);
        }
        
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = '/';
      } else {
        setError(data.detail || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-8">Регистрация</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              ❌ {error}
            </div>
          )}

          {step === 'phone' ? (
            // ШАГ 1: ВВОД ТЕЛЕФОНА
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Номер телефона *</label>
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
                Получить код
              </button>
            </div>
          ) : (
            // ШАГ 2: ВВОД КОДА И ДАННЫХ
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-600">Ваш код подтверждения:</p>
                <p className="text-3xl font-bold text-[#367666] tracking-[0.5em] font-mono">
                  {generatedCode}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newCode = generateCode();
                    setGeneratedCode(newCode);
                    setVerificationCode(newCode);
                    alert(`✅ Новый код: ${newCode}`);
                  }}
                  className="text-xs text-[#367666] hover:underline mt-2"
                >
                  Сгенерировать новый код
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Введите код *</label>
                <input 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000" 
                  maxLength={6}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Полное имя *</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Иван Иванов" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Пароль *</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Минимум 4 символа" 
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подтвердите пароль *</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Повторите пароль" 
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

          <p className="text-center text-gray-500 mt-6">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-[#367666] font-semibold hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}