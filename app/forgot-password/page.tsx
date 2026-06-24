// app/forgot-password/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!phone) {
      setError('Введите номер телефона');
      setLoading(false);
      return;
    }

    try {
      console.log('📤 Отправка запроса на восстановление пароля:', { phone });

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
        }),
      });

      const data = await response.json();
      console.log('📥 Ответ:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        // Clear the form
        setPhone('');
      } else {
        setError(data.detail || 'Ошибка восстановления пароля');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-3">
            Восстановление пароля
          </h1>
          <p className="text-center text-gray-500 mb-8 text-sm">
            Введите номер телефона, и мы отправим инструкции по восстановлению пароля
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-2xl text-sm border border-green-100">
              ✅ Инструкции по восстановлению пароля отправлены на ваш номер телефона
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+7 777 777 77 77" 
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg mt-4 hover:bg-[#2a5a4d] transition disabled:opacity-70 shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Отправка...
                </span>
              ) : 'Восстановить пароль'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-gray-600 text-base">
              Вспомнили пароль?{' '}
              <Link href="/login" className="text-[#367666] font-semibold hover:underline text-base">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}