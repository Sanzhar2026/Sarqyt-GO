'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import OfferCard from './components/OfferCard';
import { useGeolocation } from './hooks/useGeolocation';
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

export default function HomePage() {
  const router = useRouter();
  const location = useGeolocation();
  const { lang, setLang } = useLanguage(); 
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [user, setUser] = useState<{ name: string; id: number; phone?: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  // Получаем токен
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    setAuthToken(token);
  }, []);

  // WebSocket URL только если есть токен
  const wsUrl = authToken 
    ? `wss://toogood-2ncf.onrender.com/ws?token=${encodeURIComponent(authToken)}` 
    : null;
  
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  const refreshAfterOrder = useCallback(async () => {
    await fetchBags();
  }, []);

  const fetchBags = useCallback(async (showLoading = false, isInitial = false) => {
    if (!isMountedRef.current) return;
    
    if (showLoading && !isInitial) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await fetch(`/api/surprise-bags`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const filteredBags = data.filter((bag: SurpriseBag) => bag.available_quantity > 0);
      
      if (isMountedRef.current) {
        setBags(filteredBags);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      if (isMountedRef.current) {
        setBags([]);
      }
    } finally {
      if (isMountedRef.current) {
        if (showLoading && !isInitial) setIsRefreshing(false);
        if (isInitial) setLoading(false);
      }
    }
  }, []);

  const showNotification = (title: string, body: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-4 right-4 z-50 p-4 rounded-xl text-white text-center animate-slide-down ${
      type === 'success' ? 'bg-[#367666]' : type === 'warning' ? 'bg-orange-600' : 'bg-blue-600'
    }`;
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🚚'}</span>
        <div class="flex-1">
          <div class="font-bold">${title}</div>
          <div class="text-sm opacity-90">${body}</div>
        </div>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    }
  };

  const showCourierArrivedNotification = (data: any) => {
    const { order_id, order_number, courier_name } = data;
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-4 right-4 z-50 animate-slide-up';
    toast.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-[#367666]">
        <div class="p-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#367666]/10 rounded-full flex items-center justify-center text-lg">🚚</div>
            <div class="flex-1">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-gray-800 text-sm">Курьер прибыл!</h3>
                <button id="close-notification-btn" class="text-gray-400 hover:text-gray-600 text-lg leading-none ml-2">✕</button>
              </div>
              <p class="text-[#367666] text-xs">Заказ #${order_number} • ${courier_name}</p>
            </div>
          </div>
          
          <div class="flex gap-2 mt-3">
            <button id="go-to-order-btn" class="flex-1 bg-[#367666] text-white py-1.5 rounded-xl text-xs font-semibold hover:bg-[#2a5a4d] transition">
              Перейти
            </button>
            <button id="later-btn" class="px-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 transition">
              Позже
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    const goToOrder = () => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => {
        toast.remove();
        router.push(`/orders/${order_id}`);
      }, 300);
    };
    
    const closeNotification = () => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    };
    
    toast.querySelector('#go-to-order-btn')?.addEventListener('click', goToOrder);
    toast.querySelector('#later-btn')?.addEventListener('click', closeNotification);
    toast.querySelector('#close-notification-btn')?.addEventListener('click', closeNotification);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        closeNotification();
      }
    }, 6000);
  };

  const handleSupplierClick = (supplierId: number, supplierName: string) => {
    router.push(`/supplier/${supplierId}`);
  };

  // Обработка WebSocket сообщений
  useEffect(() => {
    if (!lastMessage) return;
    
    if (lastMessage.type === 'new_bag' || lastMessage.type === 'update_bag') {
      fetchBags(false, false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Новый сюрприз!', {
          body: 'Появился новый сюрприз рядом с вами!',
          icon: '/logo.png'
        });
      }
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
    
    if (lastMessage.type === 'courier_arrived') {
      showCourierArrivedNotification(lastMessage.data);
    }
    
    if (lastMessage.type === 'order_assigned') {
      const { courier_name, courier_phone, estimated_time } = lastMessage.data;
      showNotification(
        'Курьер назначен!',
        `${courier_name} (${courier_phone}) везет ваш заказ. Ожидайте ${estimated_time || 30} минут.`,
        'info'
      );
    }
  }, [lastMessage, fetchBags]);

  const handleManualRefresh = () => {
    fetchBags(true, false);
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
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

  useEffect(() => {
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
        const res = await fetch(`/api/check-auth`, { 
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const userData = {
              name: data.user_name,
              id: data.user_id,
              phone: data.user_phone
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
  }, []);

  useEffect(() => {
    if (showSplash) return;
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      fetchBags(true, true);
    }
  }, [showSplash, fetchBags]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleRefreshOffers = () => {
      fetchBags(false, false);
    };
    window.addEventListener('refreshOffers', handleRefreshOffers);
    return () => window.removeEventListener('refreshOffers', handleRefreshOffers);
  }, [fetchBags]);

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

  // Splash screen показывается только при первом запуске
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#367666] flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <LogoCircle />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header с логотипом слева, без номера телефона */}
      <div className="bg-[#367666] text-white px-6 pt-4 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-white">SARQYT</span>{' '}
            <span className="text-[#FFD700]">GO</span>
          </h1>
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

      {/* Toggle Buttons: List / Map */}
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

      {/* White Card Container */}
      <div className="px-6 mt-6 pb-32">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg flex items-center gap-2">
              {t[lang].nearbyShops}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Сюрприз-пакеты рядом с вами</p>
          </div>
          
          {viewMode === 'list' ? (
            <div className="p-4">
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
                  onClick={handleManualRefresh}
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
              
              <div className="space-y-4">
                {bags.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😢</div>
                    <p className="text-gray-500">{t[lang].noOffers}</p>
                    <button 
                      onClick={handleManualRefresh}
                      className="mt-4 bg-[#367666] text-white px-6 py-2 rounded-xl text-sm"
                    >
                      Обновить
                    </button>
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
                      onOrderSuccess={refreshAfterOrder}
                    />
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-[500px]">
              <SuppliersMap 
                userLat={location.lat} 
                userLon={location.lon}
                onSupplierClick={handleSupplierClick}
                showUserLocation={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}