// app/profile/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AvatarCropper from '../components/AvatarCropper';

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  email?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          
          try {
            const avatarResponse = await fetch(`/users/avatar-file/${data.user.id}`);
            if (avatarResponse.ok) {
              setAvatarUrl(`/users/avatar-file/${data.user.id}?t=${Date.now()}`);
            }
          } catch (e) {
            // Аватара нет
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setUploading(true);

    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', croppedBlob, 'avatar.webp');

    try {
      const response = await fetch(`/users/${user?.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setAvatarUrl(`/users/avatar-file/${user?.id}?t=${Date.now()}`);
        alert('Аватар обновлен!');
      } else {
        alert('Ошибка при загрузке аватара');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке');
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      sessionStorage.removeItem('userToken');
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('isLoggedIn');
      router.push('/login');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-sm">
          <div className="text-5xl mb-4">😢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Ошибка</h2>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#367666] text-white px-6 py-2 rounded-xl hover:bg-[#2a5a4d] transition"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-sm">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Пользователь не найден</h2>
          <Link href="/login">
            <button className="mt-4 bg-[#367666] text-white px-6 py-2 rounded-xl hover:bg-[#2a5a4d] transition">
              Войти
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = user.full_name || `${user.first_name} ${user.last_name}`;
  const userInitials = user.first_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {showCropper && selectedFile && (
        <AvatarCropper
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
        />
      )}

      <div className="bg-[#367666] text-white px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Профиль</h1>
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {/* Аватарка */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {avatarUrl ? (
                  <Image 
                    src={avatarUrl}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl font-bold text-gray-400">
                    {userInitials}
                  </span>
                )}
              </div>
              
              <label 
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-[#367666] text-white p-2 rounded-full cursor-pointer hover:bg-[#2a5a4d] transition shadow-md ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && (
              <p className="text-sm text-gray-500 mt-2">Загрузка...</p>
            )}
            <h2 className="text-xl font-bold text-gray-800 mt-3">
              {fullName || 'Пользователь'}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {user.is_active ? 'Активен' : 'Неактивен'}
            </p>
          </div>

          {/* Данные пользователя */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs text-gray-400">Имя</p>
              <p className="font-medium text-gray-800">{fullName || '—'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Телефон</p>
              <p className="font-medium text-gray-800">{user.phone || '—'}</p>
            </div>

            {user.email && (
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400">Роль</p>
              <p className="font-medium text-gray-800 capitalize">
                {user.role || 'Клиент'}
              </p>
            </div>

            {user.created_at && (
              <div>
                <p className="text-xs text-gray-400">Дата регистрации</p>
                <p className="font-medium text-gray-800">{formatDate(user.created_at)}</p>
              </div>
            )}
          </div>

          {/* ✅ ВСЕ КНОПКИ ЗЕЛЕНЫЕ */}
          <div className="mt-6 space-y-3">
            {user.role !== 'courier' && (
              <Link href="/courier/register">
                <button className="w-full bg-[#367666] text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-[#2a5a4d] transition shadow-md">
                  Стать курьером
                </button>
              </Link>
            )}

            <button 
              onClick={handleLogout}
              className="w-full bg-[#367666] text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-[#2a5a4d] transition shadow-md"
            >
              Выйти
            </button>

            <Link href="/">
              <button className="w-full bg-[#367666] text-white py-3.5 rounded-2xl font-semibold text-base hover:bg-[#2a5a4d] transition shadow-md">
                На главную
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}