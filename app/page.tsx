'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import CategoryCard from './components/CategoryCard';
import OfferCard from './components/OfferCard';
import { useGeolocation } from './hooks/useGeolocation';
import { useWebSocket } from './hooks/useWebSocket';
import { setGlobalHideBottomNav } from './layout';
import { useLanguage } from './layout';

type Tab = 'preferences' | 'discover';

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
}

export default function HomePage() {
  const router = useRouter();
  const location = useGeolocation();
  const { lang, setLang } = useLanguage(); 
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [user, setUser] = useState<{ name: string; id: number; phone?: string } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { isConnected, lastMessage } = useWebSocket('wss://toogood-2ncf.onrender.com/ws');
  
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);
  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Функция обновления после заказа
  const refreshAfterOrder = useCallback(async () => {
    console.log('🔄 Обновление данных после заказа...');
    await fetchBags();
  }, []);

  // Функция загрузки данных
  const fetchBags = useCallback(async (showLoading = false, isInitial = false) => {
    if (!isMountedRef.current) return;
    
    if (showLoading && !isInitial) {
      setIsRefreshing(true);
    }
    
    try {
      console.log('🔄 Загрузка сюрпризов...');
      const response = await fetch(`${API_URL}/api/surprise-bags`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 ДАННЫЕ ИЗ API:', data);
      
      const filteredBags = data.filter((bag: SurpriseBag) => bag.available_quantity > 0);
      
      console.log('✅ ПОСЛЕ ФИЛЬТРАЦИИ:', filteredBags.length, 'сюрпризов');
      
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
  }, [API_URL]);

  // ✅ Функция показа уведомления
  const showNotification = (title: string, body: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-4 right-4 z-50 p-4 rounded-xl text-white text-center animate-slide-down ${
      type === 'success' ? 'bg-emerald-600' : type === 'warning' ? 'bg-orange-600' : 'bg-blue-600'
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

  // ✅ НОВОЕ: уведомление о прибытии курьера с кнопкой "Перейти к заказу"
  const showCourierArrivedNotification = (data: any) => {
    const { order_id, order_number, courier_name, courier_phone } = data;
    
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border-l-4 border-green-500 overflow-hidden animate-slide-down';
    toast.innerHTML = `
      <div class="p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">🚚</div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-800">Курьер прибыл!</h3>
            <p class="text-sm text-gray-500">${courier_name} • ${courier_phone}</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-3">Заказ #${order_number} ожидает подтверждения</p>
        <div class="flex gap-2">
          <button id="go-to-order-btn" class="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold">
            📦 Перейти к заказу
          </button>
          <button id="close-notification-btn" class="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm">
            ✕
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    toast.querySelector('#go-to-order-btn')?.addEventListener('click', () => {
      toast.remove();
      router.push(`/orders/${order_id}`);
    });
    
    toast.querySelector('#close-notification-btn')?.addEventListener('click', () => {
      toast.remove();
    });
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, 15000);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚚 Курьер прибыл!', {
        body: `${courier_name} ожидает вас. Нажмите чтобы подтвердить заказ #${order_number}`,
        icon: '/logo.png'
      });
    }
  };

  // WebSocket обработка
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('📡 WebSocket событие:', lastMessage);
    
    if (lastMessage.type === 'new_bag' || lastMessage.type === 'update_bag') {
      console.log('🆕 Новый сюрприз! Мгновенное обновление...');
      fetchBags(false, false);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Новый сюрприз! 🎁', {
          body: 'Появился новый сюрприз рядом с вами!',
          icon: '/logo.png'
        });
      }
    }
    
    if (lastMessage.type === 'delete_bag') {
      console.log('🗑️ Сюрприз удален, обновляем список...');
      fetchBags(false, false);
    }
    
    if (lastMessage.type === 'bag_quantity_updated' && lastMessage.data) {
      const { bag_id, available_quantity } = lastMessage.data;
      console.log(`📦 Сюрприз ${bag_id}: осталось ${available_quantity}`);
      
      setBags(prevBags => 
        prevBags
          .map(bag => 
            bag.id === bag_id 
              ? { ...bag, available_quantity: available_quantity }
              : bag
          )
          .filter(bag => bag.available_quantity > 0)
      );
      
      setLastUpdate(new Date());
    }
    
    // ✅ ОБРАБОТКА ПРИБЫТИЯ КУРЬЕРА
    if (lastMessage.type === 'courier_arrived') {
      console.log('🚚 КУРЬЕР ПРИБЫЛ!', lastMessage.data);
      showCourierArrivedNotification(lastMessage.data);
    }
    
    // ✅ Обработка назначения курьера
    if (lastMessage.type === 'order_assigned') {
      const { order_id, courier_name, courier_phone, estimated_time } = lastMessage.data;
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

  // Splash screen
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

  // Загрузка данных пользователя
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
        const res = await fetch(`${API_URL}/api/check-auth`, { 
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

  // Первоначальная загрузка
  useEffect(() => {
    if (showSplash) return;
    
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true;
      fetchBags(true, true);
    }
  }, [showSplash, fetchBags]);

  // Очистка
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Обновление при событии
  useEffect(() => {
    const handleRefreshOffers = () => {
      console.log('🔄 Принудительное обновление списка');
      fetchBags(false, false);
    };
    
    window.addEventListener('refreshOffers', handleRefreshOffers);
    
    return () => {
      window.removeEventListener('refreshOffers', handleRefreshOffers);
    };
  }, [fetchBags]);

  const handleLogout = async () => {
    await fetch(`${API_URL}/logout`, { method: 'GET', credentials: 'include' });
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isLoggedIn');
    setUser(null);
    window.location.href = '/';
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const t = {
    kz: {
      greeting: 'Сәлем',
      guest: 'Қонақ',
      subtitle: 'Бүгін не құтқарасыз?',
      logout: 'Шығу',
      login: 'Кіру',
      register: 'Тіркелу',
      search: 'Мейрамхана немесе тағам іздеу...',
      preferences: 'Қалауларыңыз',
      discover: 'Жақын ұсыныстар',
      filter: 'Фильтр',
      nearbyOffers: 'Жақын маңдағы ұсыныстар',
      noOffers: 'Қазір жақын маңда ұсыныс жоқ',
      iLike: 'Маған ұнайды',
      myOrders: 'Менің тапсырыстарым',
      refresh: 'Жаңарту',
      lastUpdate: 'Соңғы жаңарту',
      connected: 'Қосылған',
      disconnected: 'Қосылым жоқ'
    },
    ru: {
      greeting: 'Привет',
      guest: 'Гость',
      subtitle: 'Что спасете сегодня?',
      logout: 'Выйти',
      login: 'Войти',
      register: 'Регистрация',
      search: 'Поиск ресторана или блюда...',
      preferences: 'Предпочтения',
      discover: 'Ближайшие предложения',
      filter: 'Фильтр',
      nearbyOffers: 'Предложения рядом',
      noOffers: 'Рядом нет предложений',
      iLike: 'Мне нравится',
      myOrders: 'Мои заказы',
      refresh: 'Обновить',
      lastUpdate: 'Последнее обновление',
      connected: 'Подключено',
      disconnected: 'Нет соединения'
    }
  };

  const categories = [
    { id: 'kazakh', nameKz: 'Қазақ тағамы', nameRu: 'Казахская кухня', emoji: '🍖' },
    { id: 'fastfood', nameKz: 'Фастфуд', nameRu: 'Фастфуд', emoji: '🍔' },
    { id: 'pizza', nameKz: 'Пицца', nameRu: 'Пицца', emoji: '🍕' },
    { id: 'healthy', nameKz: 'Здоровое питание', nameRu: 'Здоровое питание', emoji: '🥗' },
    { id: 'asian', nameKz: 'Азия тағамы', nameRu: 'Азиатская кухня', emoji: '🍜' },
    { id: 'desserts', nameKz: 'Тәттілер', nameRu: 'Десерты', emoji: '🍰' }
  ];

  const LogoCircle = () => (
    <div className="w-80 h-80 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shadow-2xl">
      <Image 
        src="/logotype.jpeg" 
        alt="Sarqyn Food Logo" 
        sizes="(max-width: 768px) 100vw, 320px"
        width={800} 
        height={800} 
        className="object-cover w-full h-full"
      />
    </div>
  );

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-emerald-600 flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <LogoCircle />
          <h1 className="text-4xl font-bold text-white mb-2">Sarqyn Food</h1>
          <p className="text-emerald-100 text-sm">Дәмді тағамдар дүниені құтқарады</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className={`fixed top-0 right-0 z-50 m-2 px-2 py-1 rounded-full text-xs ${
        isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {isConnected ? '🟢 ' + t[lang].connected : '🔴 ' + t[lang].disconnected}
      </div>

      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-[28px] leading-none font-black tracking-[-1px] text-black">
                  SARQYT <span className="text-[#FF9500]">GO</span>
                </h1>
              </div>
            </div>
            {user && user.phone && (
              <div className="mt-2 flex items-center gap-2 text-xs bg-white/10 rounded-xl px-3 py-1.5 w-fit">
                <span>📞</span>
                <span>{user.phone}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <div className="flex gap-1 mr-2">
              <button
                onClick={() => setLang('kz')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  lang === 'kz' 
                    ? 'bg-white text-emerald-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Қаз
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  lang === 'ru' 
                    ? 'bg-white text-emerald-600' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Рус
              </button>
            </div>
            
            {user ? (
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl text-sm transition flex items-center gap-2">
                <span>🚪</span>
                <span>{t[lang].logout}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login"><button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl text-sm transition">{t[lang].login}</button></Link>
                <Link href="/signup"><button className="bg-white/30 hover:bg-white/40 px-4 py-2 rounded-2xl text-sm transition">{t[lang].register}</button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4">
        <input type="text" placeholder={t[lang].search} className="w-full px-6 py-4 rounded-3xl bg-white shadow text-base focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {user && (
        <div className="px-6 mt-4">
          <Link href="/orders">
            <button className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <span>📋</span>
              <span>{t[lang].myOrders}</span>
            </button>
          </Link>
        </div>
      )}

      <div className="px-6 mt-6">
        <div className="bg-gray-100 p-1 rounded-3xl flex">
          <button onClick={() => setActiveTab('preferences')} className={`flex-1 py-3 rounded-3xl font-semibold text-sm transition-all ${activeTab === 'preferences' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>{t[lang].preferences}</button>
          <button onClick={() => setActiveTab('discover')} className={`flex-1 py-3 rounded-3xl font-semibold text-sm transition-all ${activeTab === 'discover' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>{t[lang].discover}</button>
        </div>
      </div>

      <div className="px-6 mt-6 pb-24">
        {activeTab === 'preferences' ? (
          <>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-xl">{t[lang].preferences}</h2>
              <button className="text-emerald-600 text-sm">{t[lang].filter}</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  name={lang === 'kz' ? category.nameKz : category.nameRu} 
                  emoji={category.emoji} 
                  isSelected={selectedCategories.includes(category.id)} 
                  onClick={() => handleCategoryClick(category.id)} 
                  lang={lang} 
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-xl">🔥 {t[lang].nearbyOffers}</h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs hover:bg-emerald-700 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {isRefreshing ? '🔄 ...' : '🔄 ' + t[lang].refresh}
                </button>
              </div>
            </div>
            
            <div className="text-right text-xs text-gray-400 mb-3">
              {t[lang].lastUpdate}: {lastUpdate.toLocaleTimeString()}
              {isConnected && <span className="ml-2 text-green-500">● Live</span>}
            </div>
            
            <div className="space-y-6">
              {bags.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl">
                  <div className="text-6xl mb-4">😢</div>
                  <p className="text-gray-500">{t[lang].noOffers}</p>
                  <button 
                    onClick={handleManualRefresh}
                    className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm"
                  >
                    🔄 Обновить
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
          </>
        )}
      </div>
    </div>
  );
}