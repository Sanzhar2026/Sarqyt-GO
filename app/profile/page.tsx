// app/profile/page.tsx - с обрезкой аватара

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../layout';
import { Camera, X, Loader2 } from 'lucide-react';
import AvatarCropper from '../components/AvatarCropper';

export default function ProfilePage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarExists, setAvatarExists] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      logout: 'Шығу',
      cropAvatar: 'Аватарды қиып алу'
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
      logout: 'Выйти',
      cropAvatar: 'Обрезать аватар'
    }
  };

  // Обработка выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл не должен превышать 5 MB');
        return;
      }
      setSelectedFile(file);
      setShowCropper(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Загрузка обрезанного аватара
  const uploadCroppedAvatar = async (croppedBlob: Blob) => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    setIsUploading(true);
    setShowCropper(false);
    
    try {
      const formData = new FormData();
      formData.append('avatar', croppedBlob, `avatar_${user?.id}.webp`);
      
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
      
      setAvatarVersion(prev => prev + 1);
      setAvatarExists(true);
      
      alert('✅ Аватар успешно обновлен!');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Ошибка при загрузке аватара');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
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
      
      setAvatarVersion(prev => prev + 1);
      setAvatarExists(false);
      
      alert('✅ Аватар удален');
      
    } catch (error) {
      console.error('Delete error:', error);
      alert('Ошибка при удалении аватара');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  // Загрузка данных пользователя
  useEffect(() => {
    const loadUserData = async () => {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/check-auth`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser({
              id: data.user_id,
              full_name: data.user_name,
              phone: data.user_phone,
            });
            
            const avatarCheck = await fetch(`${API_URL}/users/avatar-file/${data.user_id}`);
            setAvatarExists(avatarCheck.status === 200);
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
        
        {/* Аватар */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
              {isLoggedIn && avatarExists ? (
                <img 
                  src={`${API_URL}/users/avatar-file/${user.id}?v=${avatarVersion}`}
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={() => setAvatarExists(false)}
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}
            </div>
            
            {isLoggedIn && !isUploading && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={24} className="text-white" />
                </button>
                
                {avatarExists && (
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
      </div>

      {/* Menu */}
      <div className="p-6 space-y-3">
        {!isLoggedIn ? (
          <>
            <Link href="/login">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="font-medium text-gray-700">{t[lang].login}</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            <Link href="/signup">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="font-medium text-gray-700">{t[lang].register}</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link href="/orders">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="font-medium text-gray-700">{t[lang].myOrders}</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            
            <Link href="/courier">
              <div className="bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition cursor-pointer">
                <span className="font-medium text-gray-700">{t[lang].becomeCourier}</span>
                <span className="text-gray-400">→</span>
              </div>
            </Link>
            
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

      {/* Cropper Modal */}
      {showCropper && selectedFile && (
        <AvatarCropper
          imageFile={selectedFile}
          onCropComplete={uploadCroppedAvatar}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
}