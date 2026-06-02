'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import CategoryCard from './components/CategoryCard';
import OfferCard from './components/OfferCard';
import { useGeolocation } from './hooks/useGeolocation';
import { useWebSocket } from './hooks/useWebSocket';
import { setGlobalHideBottomNav } from './layout';
import { useLanguage } from './layout';

const SuppliersMap = dynamic(() => import('./components/SuppliersMap'), { ssr: false });

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
  is_active?: boolean;  // ✅ Добавлено
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
  const [showSupplierBags, setShowSupplierBags] = useState(false);
  const [selectedSupplierBags, setSelectedSupplierBags] = useState<SurpriseBag[]>([]);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);
  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Получаем токен
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    console.log('🔑 Токен на главной:', token ? 'Есть' : 'Нет');
    setAuthToken(token);
  }, []);

  // WebSocket URL только если есть токен
  const wsUrl = authToken 
    ? `wss://toogood-2ncf.onrender.com/ws?token=${encodeURIComponent(authToken)}` 
    : null;
  
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  const refreshAfterOrder = useCallback(async () => {
    console.log('🔄 Обновление данных после заказа...');
    await fetchBags();
  }, []);

  const fetchBags = useCallback(async (showLoading = false, isInitial = false) => {
    if (!isMountedRef.current) return;
    
    if (showLoading && !isInitial) {
      setIsRefreshing(true);
    }
    
    try {
      console.log('🔄 Загрузка сюрпризов...');
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

  const showCourierArrivedNotification = (data: any) => {
  console.log('🔔 Показываем уведомление о прибытии курьера:', data);
  
  const { order_id, order_number, courier_name, courier_phone, message } = data;
  
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 left-4 right-4 z-50 animate-slide-up';
  toast.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden border-l-4 border-emerald-500">
      <div class="p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">🚚</div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-800 text-sm">Курьер прибыл!</h3>
            <p class="text-emerald-600 text-xs">Заказ #${order_number}</p>
          </div>
          <button id="close-notification-btn" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="font-semibold text-gray-800 text-sm">${courier_name}</p>
            <p class="text-gray-500 text-xs flex items-center gap-1">📞 ${courier_phone}</p>
          </div>
          <div class="bg-emerald-100 px-2 py-1 rounded-full">
            <span class="text-emerald-700 text-xs font-medium">Курьер</span>
          </div>
        </div>
        
        <p class="text-gray-600 text-xs mb-4">${message || `Курьер ожидает вас для передачи заказа #${order_number}`}</p>
        
        <div class="flex gap-2">
          <button id="go-to-order-btn" class="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition active:scale-95">
            📦 Перейти
          </button>
          <button id="later-btn" class="px-4 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition active:scale-95">
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
  }, 8000);
};

  const handleSupplierClick = (supplierId: number, supplierName: string) => {
    const supplierBags = bags.filter(bag => bag.supplier_id === supplierId);
    setSelectedSupplierBags(supplierBags);
    setSelectedSupplierName(supplierName);
    setShowSupplierBags(true);
  };

  const closeSupplierBags = () => {
    setShowSupplierBags(false);
    setSelectedSupplierBags([]);
    setSelectedSupplierName('');
  };

  // Обработка WebSocket сообщений
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('📡 WebSocket событие:', lastMessage);
    
    if (lastMessage.type === 'new_bag' || lastMessage.type === 'update_bag') {
      fetchBags(false, false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Новый сюрприз! 🎁', {
          body: 'Появился новый сюрприз рядом с вами!',
          icon: '/logo.png'
        });
      }
    }
    
    if (lastMessage.type === 'delete_bag') {
      fetchBags(false, false);
    }
    
    // ✅ ОБРАБОТКА ОБНОВЛЕНИЯ КОЛИЧЕСТВА ТОВАРА
    if (lastMessage.type === 'bag_quantity_updated' && lastMessage.data) {
      const { bag_id, available_quantity, is_active } = lastMessage.data;
      
      console.log(`🔄 Обновляем товар ${bag_id}: осталось ${available_quantity}`);
      
      setBags(prevBags => {
        // Обновляем количество у конкретного товара
        const updatedBags = prevBags.map(bag => 
          bag.id === bag_id 
            ? { ...bag, available_quantity: available_quantity, is_active: is_active ?? bag.is_active }
            : bag
        );
        
        // ✅ Убираем товары, у которых закончилось количество
        const filteredBags = updatedBags.filter(bag => bag.available_quantity > 0);
        
        console.log(`📦 Было ${prevBags.length} товаров, стало ${filteredBags.length}`);
        
        if (filteredBags.length !== prevBags.length) {
          setLastUpdate(new Date());
        }
        
        return filteredBags;
      });
    }
    
    if (lastMessage.type === 'courier_arrived') {
      console.log('🚚 КУРЬЕР ПРИБЫЛ!', lastMessage.data);
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

  const handleLogout = async () => {
    await fetch(`/api/logout`, { method: 'GET', credentials: 'include' });
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('authToken');
    setUser(null);
    window.location.href = '/';
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
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
      disconnected: 'Қосылым жоқ',
      nearbyShops: 'Жақын маңдағы дүкендер мен кафелер',
      viewSurprises: 'Тосын сыйларды көру',
      close: 'Жабу',
      available: 'Қолжетімді',
      from: 'бастап',
      order: 'Тапсырыс беру'
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
      disconnected: 'Нет соединения',
      nearbyShops: 'Ближайшие магазины и кафе',
      viewSurprises: 'Посмотреть сюрпризы',
      close: 'Закрыть',
      available: 'Доступно',
      from: 'от',
      order: 'Заказать'
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

  const LogoCircle = () => {
    const [imgError, setImgError] = useState(false);
    
    if (imgError) {
      return (
        <div className="w-80 h-80 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center shadow-2xl">
          <div className="text-center">
            <div className="text-8xl mb-4">🍽️</div>
            <p className="text-white text-xl font-bold">Sarqyn Food</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-80 h-80 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shadow-2xl">
        <Image 
          src="/logotype.jpeg" 
          alt="Sarqyt GO" 
          sizes="(max-width: 768px) 100vw, 320px"
          width={800} 
          height={800} 
          className="object-cover w-full h-full"
          priority
          onError={() => setImgError(true)}
        />
      </div>
    );
  };

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
                  lang === 'kz' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Қаз
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  lang === 'ru' ? 'bg-white text-emerald-600' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Рус
              </button>
            </div>
            
            {user ? (
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl text-sm transition flex items-center gap-2">
                <span>🚪</span><span>{t[lang].logout}</span>
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

      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span>🏪</span> {t[lang].nearbyShops}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Сюрприз-пакеты рядом с вами</p>
          </div>
          <div className="h-72">
            <SuppliersMap 
              userLat={location.lat} 
              userLon={location.lon}
              onSupplierClick={handleSupplierClick}
              showUserLocation={true}
            />
          </div>
        </div>
      </div>

      {showSupplierBags && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{selectedSupplierName}</h3>
              <button onClick={closeSupplierBags} className="text-gray-400 text-2xl">&times;</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {selectedSupplierBags.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Нет доступных сюрпризов</p>
              ) : (
                <div className="space-y-4">
                  {selectedSupplierBags.map((bag) => (
                    <div key={bag.id} className="border rounded-xl p-3 hover:shadow-md transition">
                      <div className="flex gap-3">
                        {bag.image_url && (
                          <img src={bag.image_url} alt={bag.name} className="w-20 h-20 object-cover rounded-lg" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{bag.name}</h4>
                          <p className="text-xs text-gray-500 line-through">{bag.original_price} ₸</p>
                          <p className="text-emerald-600 font-bold">{bag.discounted_price} ₸</p>
                          <p className="text-xs text-gray-400">Доступно: {bag.available_quantity} шт.</p>
                          <button 
                            onClick={() => router.push(`/offers/${bag.id}`)}
                            className="mt-2 bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs"
                          >
                            {t[lang].order}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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