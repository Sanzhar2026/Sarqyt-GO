'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        sessionStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          name: data.user.full_name,
          full_name: data.user.full_name,
          phone: data.user.phone
        }));
        
        if (data.token) {
          sessionStorage.setItem('authToken', data.token);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#367666]/10 to-white">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center text-[#367666] mb-8">Войти</h1>
          
          {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100">{error}</div>}

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
          </form>

          <p className="text-center text-gray-500 mt-8">
            Нет аккаунта? <Link href="/signup" className="text-[#367666] font-semibold hover:underline">Зарегистрироваться</Link>
          </p>
        </div>
      </div>
    </div>
  );
}