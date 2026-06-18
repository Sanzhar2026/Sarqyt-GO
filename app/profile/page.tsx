// app/profile/page.tsx - С AVATAR_CROPPER

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AvatarCropper from '../components/AvatarCropper';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('courierToken') || 
           sessionStorage.getItem('authToken') ||
           null;
  };

  // Загрузка аватара
  const fetchAvatar = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}/users/avatar-file/${userId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAvatarUrl(url);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            if (data.user.id) {
              fetchAvatar(data.user.id);
            }
          } else {
            const storedUser = sessionStorage.getItem('user');
            if (storedUser) {
              const parsed = JSON.parse(storedUser);
              setUser(parsed);
              if (parsed.id) fetchAvatar(parsed.id);
            } else {
              router.push('/login');
            }
          }
        } else {
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            if (parsed.id) fetchAvatar(parsed.id);
          } else {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Ошибка:', error);
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          if (parsed.id) fetchAvatar(parsed.id);
        } else {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Выбор файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер 5MB.');
      return;
    }

    setSelectedFile(file);
    setShowCropper(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Обработка обрезанного изображения
  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setUploading(true);

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.webp');

      const response = await fetch(`${API_URL}/users/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchAvatar(user.id);
          alert('Аватар успешно обновлен!');
        }
      } else {
        alert('Ошибка загрузки аватара');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Ошибка загрузки аватара');
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  // Отмена кропа
  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedFile(null);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Пожалуйста, войдите в аккаунт</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  const isCourier = user.role === 'courier';

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-[#367666] text-white px-6 pt-12 pb-6">
          <button onClick={() => router.back()} className="mb-4 text-white hover:opacity-80 transition">
            ← Назад
          </button>
          <h1 className="text-2xl font-bold">Профиль</h1>
        </div>

        <div className="px-6 py-8">
          {/* Аватар с возможностью загрузки */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Аватар"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Изменить</span>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs text-[#367666] hover:text-[#2a5a4d] transition"
              disabled={uploading}
            >
              {uploading ? 'Загрузка...' : 'Загрузить фото'}
            </button>
            
            <h2 className="text-xl font-bold text-gray-800 mt-2">{user.full_name || 'Пользователь'}</h2>
            <p className="text-gray-500 text-sm">{user.phone || 'Телефон не указан'}</p>
            <p className="text-xs text-gray-400 mt-1">
              {isCourier ? '🚚 Курьер' : '👤 Клиент'}
            </p>
          </div>

          {/* Информация */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-4">Информация</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Имя</span>
                <span className="font-medium">{user.full_name || 'Не указано'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Телефон</span>
                <span className="font-medium">{user.phone || 'Не указан'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Роль</span>
                <span className="font-medium">
                  {isCourier ? '🚚 Курьер' : '👤 Клиент'}
                </span>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="space-y-3">
            {!isCourier && (
              <Link href="/courier/register">
                <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition">
                  🚚 Стать курьером
                </button>
              </Link>
            )}
            
            {isCourier && (
              <Link href="/courier/dashboard">
                <button className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition">
                  🚚 Панель курьера
                </button>
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Cropper Modal */}
      {showCropper && selectedFile && (
        <AvatarCropper
          imageFile={selectedFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}