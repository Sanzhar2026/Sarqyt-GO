// app/profile/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../components/LanguageSwitcher';
import AvatarCropper from '../components/AvatarCropper';
import { User, Phone, Mail, Calendar, LogOut, Home, Truck, MessageCircle, PhoneCall } from 'lucide-react';

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
  const { lang, setLang, t } = useLanguage();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const PHONE_NUMBER = '+77089249375';
  const PHONE_LINK = 'tel:+77089249375';
  const WHATSAPP_LINK = 'https://wa.me/77089249375';
  const TELEGRAM_LINK = 'https://t.me/77089249375';

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
          } catch (e) {}
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router, t]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('selectImage'));
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
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (response.ok) {
        setAvatarUrl(`/users/avatar-file/${user?.id}?t=${Date.now()}`);
        alert(t('avatarUpdated'));
      } else {
        alert(t('avatarError'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(t('avatarError'));
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleLogout = () => {
    if (confirm(t('confirmLogout'))) {
      sessionStorage.removeItem('userToken');
      localStorage.removeItem('userToken');
      sessionStorage.removeItem('isLoggedIn');
      router.push('/login');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'kk-KZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#367666]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-sm">
          <div className="text-5xl mb-4">😢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('error')}</h2>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#367666] text-white px-6 py-2 rounded-xl hover:bg-[#2a5a4d] transition"
          >
            {t('tryAgain')}
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
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('userNotFound')}</h2>
          <Link href="/login">
            <button className="mt-4 bg-[#367666] text-white px-6 py-2 rounded-xl hover:bg-[#2a5a4d] transition">
              {t('login')}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = user.full_name || `${user.first_name} ${user.last_name}`;
  const userInitials = user.first_name?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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

      <div className="bg-[#367666] text-white px-6 pt-12 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('profile')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang('ru')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition text-sm font-medium ${
                lang === 'ru' ? 'bg-white text-[#367666]' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Рус
            </button>
            <button
              onClick={() => setLang('kz')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition text-sm font-medium ${
                lang === 'kz' ? 'bg-white text-[#367666]' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Қаз
            </button>
            <button 
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
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
                  <span className="text-3xl font-bold text-gray-400">
                    {userInitials}
                  </span>
                )}
              </div>
              
              <label 
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-[#367666] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#2a5a4d] transition shadow-md ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <p className="text-xs text-gray-400 mt-2">{t('loading')}</p>
            )}
            <h2 className="text-lg font-bold text-gray-800 mt-3">
              {fullName || 'Пользователь'}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {user.is_active ? t('active') : t('inactive')}
            </p>
          </div>

          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <User size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t('name')}</p>
                <p className="text-sm font-medium text-gray-800">{fullName || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <Phone size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t('phone')}</p>
                <p className="text-sm font-medium text-gray-800">{user.phone || '—'}</p>
              </div>
            </div>

            {user.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                  <Mail size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t('email')}</p>
                  <p className="text-sm font-medium text-gray-800">{user.email}</p>
                </div>
              </div>
            )}

            {user.created_at && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                  <Calendar size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t('registered')}</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(user.created_at)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2.5">
            {user.role !== 'courier' && (
              <Link href="/courier/register">
                <button className="w-full bg-[#367666]/10 text-[#367666] text-sm font-medium py-2.5 rounded-xl hover:bg-[#367666]/20 transition flex items-center justify-center gap-2">
                  <Truck size={16} className="opacity-60" />
                  {t('becomeCourier')}
                </button>
              </Link>
            )}

            <button 
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-600 text-sm font-medium py-2.5 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"
            >
              <LogOut size={16} className="opacity-60" />
              {t('logout')}
            </button>

            <Link href="/">
              <button className="w-full bg-gray-50 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2">
                <Home size={16} className="opacity-60" />
                {t('home')}
              </button>
            </Link>
          </div>
        </div>

        {/* CALL CENTER */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <PhoneCall size={18} className="text-[#367666]" />
            <h3 className="text-base font-bold text-gray-800">{t('callCenter')}</h3>
          </div>
          
          <p className="text-sm text-gray-500 mb-1">{t('callUs')}</p>
          <p className="text-sm font-medium text-gray-700 mb-3">📞 {PHONE_NUMBER}</p>
          <p className="text-xs text-gray-400 mb-4">{t('workingHours')}</p>
          
          <div className="flex flex-wrap gap-3">
            <a 
              href={PHONE_LINK}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#367666] text-white rounded-xl hover:bg-[#2a5a4d] transition text-sm font-medium flex-1 justify-center"
            >
              <Phone size={16} />
              {t('call')}
            </a>
            
            <a 
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition text-sm font-medium flex-1 justify-center"
            >
              <MessageCircle size={16} />
              {t('whatsapp')}
            </a>
            
            <a 
              href={TELEGRAM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm font-medium flex-1 justify-center"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              {t('telegram')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}