// app/signup/page.tsx - ГЕНЕРАЦИЯ КОДА НА СТРАНИЦЕ

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('7') && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+77${digits}`;
    if (digits.startsWith('8') && digits.length === 11) return `+7${digits.slice(1)}`;
    return value;
  };

  // ✅ ГЕНЕРАЦИЯ 6-ЗНАЧНОГО КОДА
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // ✅ ШАГ 1: ГЕНЕРИРУЕМ КОД И ПОКАЗЫВАЕМ
  const sendVerification = async () => {
    if (!phone) {
      setError('Номер телефона обязателен');
      return;
    }
    
    // ✅ ГЕНЕРИРУЕМ КОД
    const code = generateCode();
    setGeneratedCode(code);
    setVerificationCode(code); // Автозаполнение
    
    // Показываем код пользователю
    alert(`✅ Ваш код подтверждения: ${code}`);
    
    setStep('verify');
    setError('');
  };

  // ✅ РЕГИСТРАЦИЯ
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
    
    // ✅ ПРОВЕРЯЕМ КОД
    if (verificationCode !== generatedCode) {
      setError('Неверный код подтверждения');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatPhoneNumber(phone);
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const response = await fetch(`${API_URL}/api/verify-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          full_name: fullName,
          password: password,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          name: fullName,
          full_name: fullName,
          phone: formattedPhone,
          role: 'customer'
        }));
        
        if (data.token) {
          sessionStorage.setItem('userToken', data.token);
        }
        
        sessionStorage.setItem('isLoggedIn', 'true');
        
        window.dispatchEvent(new Event('authUpdated'));
        window.location.href = '/';
      } else {
        setError(data.detail || 'Ошибка регистрации');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ПОВТОРНАЯ ГЕНЕРАЦИЯ КОДА
  const regenerateCode = () => {
    const newCode = generateCode();
    setGeneratedCode(newCode);
    setVerificationCode(newCode);
    alert(`✅ Новый код подтверждения: ${newCode}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-8">Регистрация</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            // ✅ ШАГ 1: ВВОД ТЕЛЕФОНА
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
                Получить код
              </button>
            </div>
          ) : (
            // ✅ ШАГ 2: ВВОД КОДА И ДАННЫХ
            <div className="space-y-4">
              {/* ПОКАЗЫВАЕМ СГЕНЕРИРОВАННЫЙ КОД */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-600">Ваш код подтверждения:</p>
                <p className="text-3xl font-bold text-[#367666] tracking-[0.5em] font-mono">
                  {generatedCode}
                </p>
                <button
                  type="button"
                  onClick={regenerateCode}
                  className="text-xs text-[#367666] hover:underline mt-2"
                >
                  Сгенерировать новый код
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Введите код</label>
                <input 
                  type="text" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value)} 
                  placeholder="000000" 
                  maxLength={6}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

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
                  placeholder="•••••••• (минимум 4 символа)" 
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