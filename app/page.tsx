// app/page.tsx - АВТОМАТИЧЕСКИЙ ПЕРЕХОД В БРАУЗЕР ДЛЯ INSTAGRAM

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Store, Gift } from 'lucide-react';
import OfferCard from './components/OfferCard';
import { useWebSocket } from './hooks/useWebSocket';
import { setGlobalHideBottomNav } from './layout';
import { useLanguage } from './layout';

const SuppliersMap = dynamic(() => import('./components/SuppliersMap'), { ssr: false });

type ViewMode = 'list' | 'map';

interface SurpriseBag {
  id: number;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url: string;
  available_quantity: number;
  supplier_name: string;
  supplier_id: number;
  is_active?: boolean;
}

interface LocationData {
  lat: number;
  lon: number;
  city: string;
  source: 'geolocation' | 'default';
}

export default function HomePage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage(); 
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [user, setUser] = useState<{ name: string; id: number; phone?: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  // ============================================================
  // ОПРЕДЕЛЕНИЕ INSTAGRAM И АВТОМАТИЧЕСКИЙ ПЕРЕХОД
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (redirectAttempted) return;
    
    const ua = navigator.userAgent.toLowerCase();
    const isInstagramBrowser = (
      ua.includes('instagram') ||
      ua.includes('fbav') ||
      ua.includes('fban') ||
      ua.includes('whatsapp') ||
      ua.includes('messenger') ||
      (ua.includes('mobile') && !ua.includes('safari') && !ua.includes('chrome') && !ua.includes('firefox'))
    );
    
    // ✅ ЕСЛИ INSTAGRAM - АВТОМАТИЧЕСКИЙ ПЕРЕХОД
    if (isInstagramBrowser && !redirectAttempted) {
      setRedirectAttempted(true);
      console.log('📱 Instagram браузер обнаружен! Автоматический переход в браузер...');
      
      const currentUrl = window.location.href;
      
      setTimeout(() => {
        // Для Android - открываем в Chrome
        if (navigator.userAgent.includes('Android')) {
          const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end;`;
          window.location.href = intentUrl;
        } 
        // Для iOS - открываем в Safari
        else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
          const safariUrl = currentUrl.replace(/^https?:\/\//, '');
          window.location.href = `x-safari-${safariUrl}`;
          
          // Fallback через 2 секунды
          setTimeout(() => {
            window.open(currentUrl, '_blank');
          }, 2000);
        } 
        // Для других браузеров
        else {
          window.open(currentUrl, '_blank');
        }
      }, 300);
    }
  }, [redirectAttempted]);

  // ============================================================
  // ПОЛУЧЕНИЕ ГЕОЛОКАЦИИ (ТОЛЬКО GPS)
  // ============================================================
  useEffect(() => {
    if (isInstagram || redirectAttempted) {
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      setLocation({
        lat: 50.318754,
        lon: 57.368359,
        city: 'Актобе',
        source: 'default'
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Актобе';
          setLocation({
            lat: latitude,
            lon: longitude,
            city: city,
            source: 'geolocation'
          });
        } catch (e) {
          setLocation({
            lat: latitude,
            lon: longitude,
            city: 'Актобе',
            source: 'geolocation'
          });
        }
        setLocationLoading(false);
      },
      (err) => {
        console.warn('⚠️ GPS ошибка:', err.message);
        setLocation({
          lat: 50.318754,
          lon: 57.368359,
          city: 'Актобе',
          source: 'default'
        });
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [isInstagram, redirectAttempted]);

  // ============================================================
  // ПОЛУЧЕНИЕ ТОКЕНА
  // ============================================================
  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
  }, []);

  // ============================================================
  // ЗАГРУЗКА СЮРПРИЗОВ
  // ============================================================
  const fetchBags = useCallback(async (showLoading = false, isInitial = false) => {
    if (!isMountedRef.current) return;
    if (isInstagram || redirectAttempted) return;
    
    if (showLoading && !isInitial) {
      setIsRefreshing(true);
    }
    
    try {
      const token = getAuthToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      let url = '/api/surprise-bags';
      if (location?.lat && location?.lon) {
        url += `?lat=${location.lat}&lon=${location.lon}`;
      }
      
      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });
      
      if (response.status === 401) {
        const retryResponse = await fetch('/api/surprise-bags', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}`);
        }
        
        const data = await retryResponse.json();
        const filteredBags = data.filter((bag: SurpriseBag) => bag.available_quantity > 0);
        
        if (isMountedRef.current) {
          setBags(filteredBags);
          setLastUpdate(new Date());
        }
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const filteredBags = data.filter((bag: SurpriseBag) => bag.available_quantity > 0);
      
      if (isMountedRef.current) {
        setBags(filteredBags);
        setLastUpdate(new Date());
        console.log('✅ Загружено', filteredBags.length, 'сюрпризов');
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      if (isMountedRef.current) {
        setBags([]);
      }
    } finally {
      if (isMountedRef.current) {
        if (showLoading && !isInitial) setIsRefreshing(false);
        if (isInitial) setLoading(false);
      }
    }
  }, [getAuthToken, location, isInstagram, redirectAttempted]);

  // ============================================================
  // ЗАГРУЗКА ПОСЛЕ ЛОКАЦИИ
  // ============================================================
  useEffect(() => {
    if (isInstagram || redirectAttempted) return;
    if (locationLoading || showSplash) return;
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      fetchBags(true, true);
    }
  }, [locationLoading, showSplash, fetchBags, isInstagram, redirectAttempted]);

  // ============================================================
  // SPLASH SCREEN
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    isMountedRef.current = true;
    
    const hasLoaded = sessionStorage.getItem('has_loaded');
    
    if (!hasLoaded) {
      setGlobalHideBottomNav(true);
      setShowSplash(true);
      
      const timer = setTimeout(() => {
        setShowSplash(false);
        setGlobalHideBottomNav(false);
        sessionStorage.setItem('has_loaded', 'true');
      }, 3500);
      
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
      setGlobalHideBottomNav(false);
    }
  }, []);

  // ============================================================
  // ПОЛЬЗОВАТЕЛЬ
  // ============================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInstagram || redirectAttempted) return;
    
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed.full_name || parsed.name,
          id: parsed.id,
          phone: parsed.phone
        });
      } catch(e) {}
    }
    
    const fetchUser = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch('/api/check-auth', { 
          credentials: 'include',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const userData = {
              name: data.user_name || data.user?.full_name,
              id: data.user_id || data.user?.id,
              phone: data.user_phone || data.user?.phone
            };
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [getAuthToken, isInstagram, redirectAttempted]);

  // ============================================================
  // WebSocket
  // ============================================================
  const wsUrl = (!isInstagram && !redirectAttempted && userToken) 
    ? `wss://toogood-production.up.railway.app/ws?token=${encodeURIComponent(userToken)}` 
    : null;
  
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  // ============================================================
  // ОБРАБОТКА СООБЩЕНИЙ WEBSOCKET
  // ============================================================
  useEffect(() => {
    if (!lastMessage || isInstagram || redirectAttempted) return;
    
    if (lastMessage.type === 'new_bag' || lastMessage.type === 'update_bag') {
      fetchBags(false, false);
    }
    
    if (lastMessage.type === 'delete_bag') {
      fetchBags(false, false);
    }
    
    if (lastMessage.type === 'bag_quantity_updated' && lastMessage.data) {
      const { bag_id, available_quantity, is_active } = lastMessage.data;
      
      setBags(prevBags => {
        const updatedBags = prevBags.map(bag => 
          bag.id === bag_id 
            ? { ...bag, available_quantity: available_quantity, is_active: is_active ?? bag.is_active }
            : bag
        );
        const filteredBags = updatedBags.filter(bag => bag.available_quantity > 0);
        if (filteredBags.length !== prevBags.length) setLastUpdate(new Date());
        return filteredBags;
      });
    }
  }, [lastMessage, fetchBags, isInstagram, redirectAttempted]);

  // ============================================================
  // CLEANUP
  // ============================================================
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ============================================================
  // REFRESH OFFERS
  // ============================================================
  useEffect(() => {
    if (isInstagram || redirectAttempted) return;
    
    const handleRefreshOffers = () => {
      fetchBags(false, false);
    };
    window.addEventListener('refreshOffers', handleRefreshOffers);
    return () => window.removeEventListener('refreshOffers', handleRefreshOffers);
  }, [fetchBags, isInstagram, redirectAttempted]);

  // ============================================================
  // ПЕРЕВОДЫ
  // ============================================================
  const t = {
    kz: {
      greeting: 'Сәлем',
      guest: 'Қонақ',
      subtitle: 'Бүгін не құтқарасыз?',
      logout: 'Шығу',
      login: 'Кіру',
      register: 'Тіркелу',
      search: 'Мейрамхана немесе тағам іздеу...',
      nearbyOffers: 'Жақын маңдағы ұсыныстар',
      noOffers: 'Қазір жақын маңда ұсыныс жоқ',
      myOrders: 'Менің тапсырыстарым',
      refresh: 'Жаңарту',
      lastUpdate: 'Соңғы жаңарту',
      connected: 'Қосылған',
      disconnected: 'Қосылым жоқ',
      nearbyShops: 'Жақын маңдағы дүкендер мен кафелер',
      list: 'Тізім',
      map: 'Карта'
    },
    ru: {
      greeting: 'Привет',
      guest: 'Гость',
      subtitle: 'Что спасете сегодня?',
      logout: 'Выйти',
      login: 'Войти',
      register: 'Регистрация',
      search: 'Поиск ресторана или блюда...',
      nearbyOffers: 'Предложения рядом',
      noOffers: 'Рядом нет предложений',
      myOrders: 'Мои заказы',
      refresh: 'Обновить',
      lastUpdate: 'Последнее обновление',
      connected: 'Подключено',
      disconnected: 'Нет соединения',
      nearbyShops: 'Ближайшие магазины и кафе',
      list: 'Список',
      map: 'Карта'
    }
  };

  // ============================================================
  // ЛОГОТИП
  // ============================================================
  const LogoCircle = () => {
    const [imgError, setImgError] = useState(false);
    
    if (imgError) {
      return (
        <div className="w-56 h-56 mx-auto rounded-full bg-white/20 flex items-center justify-center shadow-2xl">
          <div className="text-4xl font-bold tracking-tight">
            <span className="text-black">SARQYT</span>
            <span className="text-[#FF9500]">GO</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-56 h-56 mx-auto rounded-full overflow-hidden shadow-2xl">
        <div className="relative w-full h-full scale-[1.4]">
          <Image 
            src="/logotype.jpeg" 
            alt="SARQYT GO" 
            fill
            className="object-cover"
            priority
            onError={() => setImgError(true)}
          />
        </div>
      </div>
    );
  };

  // ============================================================
  // ПОКАЗЫВАЕМ ЗАГРУЗКУ ДЛЯ INSTAGRAM ПОКА ИДЕТ ПЕРЕХОД
  // ============================================================
  if (redirectAttempted || isInstagram) {
    return (
      <div className="fixed inset-0 bg-[#367666] flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <LogoCircle />
          <p className="text-white mt-6 text-lg font-medium">
            Открываем в браузере...
          </p>
          <div className="mt-4 w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ЗАГРУЗКА
  // ============================================================
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#367666] flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <LogoCircle />
        </div>
      </div>
    );
  }

  if (loading || locationLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  // ============================================================
  // ОСНОВНОЙ РЕНДЕР
  // ============================================================
  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-[#367666] text-white px-6 pt-6 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-white">SARQYT</span>{' '}
            <span className="text-[#FFD700]">GO</span>
          </h1>
          {user?.phone && (
            <p className="text-sm text-white/80 mt-1 font-medium">
              {user.phone}
            </p>
          )}
          {location?.city && (
            <p className="text-xs text-white/60 mt-0.5">
              📍 {location.city}
            </p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 -mt-4">
        <input 
          type="text" 
          placeholder={t[lang].search} 
          className="w-full px-6 py-4 rounded-2xl bg-white shadow-md text-base focus:outline-none focus:ring-2 focus:ring-[#367666] placeholder:text-gray-400"
        />
      </div>

      {/* Toggle Buttons */}
      <div className="px-6 mt-4">
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              viewMode === 'list' 
                ? 'bg-white shadow text-[#367666]' 
                : 'text-gray-400 hover:text-[#367666] hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>{t[lang].list}</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              viewMode === 'map' 
                ? 'bg-white shadow text-[#367666]' 
                : 'text-gray-400 hover:text-[#367666] hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>{t[lang].map}</span>
          </button>
        </div>
      </div>

      {/* Контейнер */}
      <div className="px-3 mt-6 pb-32">
        {viewMode === 'list' ? (
          <>
            <div className="mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Store size={20} className="text-gray-400/60" />
                {t[lang].nearbyShops}
              </h2>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <Gift size={14} className="text-gray-400" />
                Сюрприз-пакеты рядом с вами
              </p>
            </div>
            
            {user && (
              <Link href="/orders">
                <button className="w-full bg-[#367666]/10 text-[#367666] py-2.5 rounded-xl text-sm font-medium hover:bg-[#367666]/20 transition flex items-center justify-center gap-2 mb-4">
                  <span>📋</span>
                  <span>{t[lang].myOrders}</span>
                </button>
              </Link>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{t[lang].nearbyOffers}</h3>
              <button 
                onClick={() => fetchBags(true, false)}
                disabled={isRefreshing}
                className="bg-[#367666] text-white px-3 py-1 rounded-full text-xs hover:bg-[#2a5a4d] transition flex items-center gap-1 disabled:opacity-50"
              >
                {isRefreshing ? '...' : t[lang].refresh}
              </button>
            </div>
            
            <div className="text-right text-xs text-gray-400 mb-3">
              {t[lang].lastUpdate}: {lastUpdate.toLocaleTimeString()}
              {isConnected && <span className="ml-2 text-green-500">● Live</span>}
            </div>
            
            <div className="flex flex-col gap-3">
              {bags.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t[lang].noOffers}</p>
                </div>
              ) : (
                bags.map((bag, bagIdx) => (
                  <OfferCard
                    key={`${bag.id}-${lastUpdate.getTime()}-${bagIdx}`}
                    id={bag.id}
                    name={bag.name}
                    businessName={bag.supplier_name}
                    distance={`${(Math.random() * 5 + 1).toFixed(1)} км`}
                    price={bag.discounted_price}
                    originalPrice={bag.original_price}
                    discount={bag.discount_percentage}
                    imageUrl={bag.image_url}
                    description={bag.description}
                    onOrderSuccess={() => fetchBags()}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-[500px]">
            <SuppliersMap 
              userLat={location?.lat || 50.318754} 
              userLon={location?.lon || 57.368359}
              onSupplierClick={(id, name) => router.push(`/supplier/${id}`)}
              showUserLocation={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}