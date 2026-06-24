// app/reset-password/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

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

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(data.detail || 'Ошибка сброса пароля');
      }
    } catch (error) {
      console.error('❌ Ошибка:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Неверная ссылка</h1>
            <p className="text-gray-600 mb-6">Ссылка для сброса пароля недействительна</p>
            <Link href="/forgot-password" className="text-[#367666] font-semibold hover:underline">
              Запросить новую ссылку
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white p-6">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-8">
            Сброс пароля
          </h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">
              ❌ {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-2xl text-sm border border-green-100">
              ✅ Пароль успешно изменен! <Link href="/login" className="font-semibold hover:underline">Войти</Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль <span className="text-red-500">*</span>
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Новый пароль" 
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                required 
                minLength={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите пароль <span className="text-red-500">*</span>
              </label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Подтвердите пароль" 
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#367666] focus:border-transparent text-base transition" 
                required 
                minLength={6}
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
                  Сохранение...
                </span>
              ) : 'Сохранить пароль'}
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