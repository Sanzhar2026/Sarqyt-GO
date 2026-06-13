// app/profile/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../layout';
import { Camera, X, Loader2, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const t = {
    kz: {
      profile: 'Профиль',
      welcome: 'Қош келдіңіз',
      login: 'Кіру',
      register: 'Тіркелу',
      myOrders: 'Менің тапсырыстарым',
      becomeCourier: 'Курьер болу',
      language: 'Тіл',
      changePhoto: 'Фотоны өзгерту',
      removePhoto: 'Фотоны өшіру',
      uploading: 'Жүктелуде...',
      phone: 'Телефон',
      logout: 'Шығу'
    },
    ru: {
      profile: 'Профиль',
      welcome: 'Добро пожаловать',
      login: 'Войти',
      register: 'Регистрация',
      myOrders: 'Мои заказы',
      becomeCourier: 'Стать курьером',
      language: 'Язык',
      changePhoto: 'Изменить фото',
      removePhoto: 'Удалить фото',
      uploading: 'Загрузка...',
      phone: 'Телефон',
      logout: 'Выйти'
    }
  };

  // Супер-сжатие аватара (100x100, 70% качество = 5-8 KB!)
  const resizeAvatar = (file: File, targetSize: number = 100): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new window.Image(); 
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas error'));
            return;
          }
          
          // Обрезаем в квадрат (берем центр)
          const minDimension = Math.min(img.width, img.height);
          const offsetX = (img.width - minDimension) / 2;
          const offsetY = (img.height - minDimension) / 2;
          
          ctx.drawImage(
            img, 
            offsetX, offsetY, minDimension, minDimension,
            0, 0, targetSize, targetSize
          );
          
          // Конвертируем в WebP с качеством 70%
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`✅ Аватар сжат: ${(blob.size / 1024).toFixed(2)} KB`);
                resolve(blob);
              } else {
                reject(new Error('Blob creation failed'));
              }
            },
            'image/webp',
            0.7
          );
        };
        
        img.onerror = () => reject(new Error('Image load failed'));
      };
      
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  // Загрузка аватара
  const uploadAvatar = async (file: File) => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    setIsUploading(true);
    
    try {
      // Проверка типа
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      // Проверка размера исходного файла (макс 5 MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл не должен превышать 5 MB');
        return;
      }
      
      // Сжимаем аватар
      const compressedBlob = await resizeAvatar(file, 100);
      
      // Создаем FormData
      const formData = new FormData();
      formData.append('avatar', compressedBlob, `avatar_${user?.id}.webp`);
      
      // Отправляем на сервер
      const response = await fetch(`${API_URL}/users/${user?.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
      
      const data = await response.json();
      console.log('✅ Upload response:', data);
      
      // Обновляем timestamp чтобы перезагрузить аватар
      setAvatarTimestamp(Date.now());
      
      // Обновляем sessionStorage
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.avatar_url = data.avatar_url;
        sessionStorage.setItem('user', JSON.stringify(userData));
      }
      
      alert('✅ Аватар успешно обновлен!');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
    }
  };

  // Удаление аватара
  const removeAvatar = async () => {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;
    
    if (!confirm('Вы уверены, что хотите удалить аватар?')) return;
    
    setIsUploading(true);
    
    try {
      const response = await fetch(`${API_URL}/users/${user?.id}/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      // Обновляем timestamp чтобы перезагрузить аватар
      setAvatarTimestamp(Date.now());
      
      // Обновляем sessionStorage
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.avatar_url = null;
        sessionStorage.setItem('user', JSON.stringify(userData));
      }
      
      alert('✅ Аватар удален');
      
    } catch (error) {
      console.error('Delete error:', error);
      alert('Ошибка при удалении аватара');
    } finally {
      setIsUploading(false);
    }
  };

  // Обработчик выбора файла
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Выход из аккаунта
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  // Загрузка данных пользователя
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const loadUserData = async () => {
      try {
        // Запрашиваем свежие данные с сервера
        const response = await fetch(`${API_URL}/api/check-auth`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            const userData = {
              id: data.user_id,
              full_name: data.user_name,
              phone: data.user_phone,
              avatar_url: data.avatar_url
            };
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [router, API_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#367666] text-white pt-12 pb-8 px-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">{t[lang].profile}</h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'kz' 
                  ? 'bg-white text-[#367666]' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'ru' 
                  ? 'bg-white text-[#367666]' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Рус
            </button>
          </div>
        </div>
        
        {/* Аватар - используем прямой эндпоинт */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {user?.id ? (
                <img 
                  src={`${API_URL}/users/avatar-file/${user.id}?t=${avatarTimestamp}`}
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('No avatar, using default');
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<span class="text-4xl">👤</span>';
                    }
                  }}
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            
            {isLoggedIn && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isUploading ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                  ) : (
                    <Camera size={24} className="text-white" />
                  )}
                </button>
                
                {!isUploading && (
                  <button
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-lg hover:bg-red-600 transition"
                  >
                    <X size={12} className="text-white" />
                  </button>
                )}
              </>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold">
              {isLoggedIn ? (user?.full_name || user?.phone) : t[lang].welcome}
            </h2>
            {isLoggedIn && user?.phone && (
              <p className="text-white/80 text-sm mt-1">
                {t[lang].phone}: {user.phone}
              </p>
            )}
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isLoggedIn && (
          <p className="text-white/50 text-[10px] mt-3">
            📸 Аватар автоматически сжимается до ~5-8 KB
          </p>
        )}
      </div>

      {/* Menu */}
      <div className="p-6 space-y-3">
        {!isLoggedIn ? (
          <>
            <Link href="/login">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium text-gray-700">{t[lang].login}</span>
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            <Link href="/signup">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="font-medium text-gray-700">{t[lang].register}</span>
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            {/* Мои заказы - без иконки */}
            <Link href="/orders">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="font-medium text-gray-700">{t[lang].myOrders}</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            
            {/* Стать курьером - без иконки */}
            <Link href="/become-courier">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="font-medium text-gray-700">{t[lang].becomeCourier}</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            
            {/* Выйти */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <span className="font-medium text-red-600">{t[lang].logout}</span>
              <span className="text-red-400">→</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}