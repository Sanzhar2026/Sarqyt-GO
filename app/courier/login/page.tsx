// app/courier/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CourierLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPendingVerification(false);

    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/courier/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('courier', JSON.stringify(data.courier));
        router.push('/courier/dashboard');
      } else if (response.status === 403) {
        setPendingVerification(true);
        setError(data.detail || 'Ваша учетная запись ожидает подтверждения администратора');
      } else {
        setError(data.detail || 'Неверный телефон или пароль');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚚</div>
          <h1 className="text-2xl font-bold text-emerald-600">Sarqyn GO</h1>
          <p className="text-gray-500 mt-2">Вход для курьеров</p>
        </div>

        {error && (
          <div className={`p-3 rounded-xl mb-4 text-sm ${pendingVerification ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {pendingVerification ? (
              <div className="text-center">
                <div className="text-2xl mb-2">⏳</div>
                <p className="font-medium">Ваша заявка на рассмотрении</p>
                <p className="text-xs mt-1">Администратор проверит данные и подтвердит аккаунт в ближайшее время</p>
              </div>
            ) : (
              error
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="tel"
            placeholder="Телефон (+77071234567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Нет аккаунта?{' '}
            <Link href="/courier/register" className="text-emerald-600 font-medium">
              Стать курьером
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}