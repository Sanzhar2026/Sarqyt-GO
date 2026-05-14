'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getNearbyBags, type Supplier } from '../lib/api';
import CategoryCard from './components/CategoryCard';
import OfferCard from './components/OfferCard';
import { useGeolocation } from './hooks/useGeolocation';
import { setGlobalHideBottomNav } from './layout';

type Tab = 'preferences' | 'discover';
type Language = 'kz' | 'ru';

export default function HomePage() {
  const router = useRouter();
  const location = useGeolocation();
  const [lang, setLang] = useState<Language>('kz');
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [user, setUser] = useState<{ name: string; id: number; phone?: string } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  const API_URL = 'https://toogood-2ncf.onrender.com';

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
      myOrders: 'Менің тапсырыстарым'
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
      myOrders: 'Мои заказы'
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

  // ==================== SPLASH SCREEN ====================
  useEffect(() => {
    // Проверяем, была ли уже загрузка в этой сессии
    const hasLoaded = sessionStorage.getItem('has_loaded');
    
    if (!hasLoaded) {
      // Первая загрузка в этой вкладке - показываем сплеш
      setGlobalHideBottomNav(true);
      setShowSplash(true);
      
      const timer = setTimeout(() => {
        setShowSplash(false);
        setGlobalHideBottomNav(false);
        sessionStorage.setItem('has_loaded', 'true');
      }, 3500);
      
      return () => clearTimeout(timer);
    } else {
      // Перезагрузка страницы - не показываем сплеш
      setShowSplash(false);
      setGlobalHideBottomNav(false);
      setInitialLoad(false);
    }
  }, []);

  // Load language
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'kz' || savedLang === 'ru')) {
      setLang(savedLang);
    }
  }, []);

  const toggleLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  // Загрузка данных пользователя
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
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
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Get location and load suppliers
  useEffect(() => {
    if (showSplash) return;
    
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const data = await getNearbyBags(lat, lon, 10);
          setSuppliers(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );
  }, [lang, showSplash]);

  const handleLogout = async () => {
    await fetch(`${API_URL}/logout`, { method: 'GET', credentials: 'include' });
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
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

  // Логотип в БОЛЬШОМ КРУГЕ
  const LogoCircle = () => (
    <div className="w-56 h-56 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shadow-2xl">
      <Image 
        src="/logotype.jpeg" 
        alt="Sarqyn Food Logo" 
        width={220} 
        height={220} 
        className="object-cover w-full h-full"
      />
    </div>
  );

  // Splash Screen
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

  if (loading || location.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              {t[lang].greeting}, {user ? user.name : t[lang].guest}! 👋
            </h1>
            <p className="text-emerald-100 mt-1">{t[lang].subtitle}</p>
            {user && user.phone && (
              <div className="mt-2 flex items-center gap-2 text-xs bg-white/10 rounded-xl px-3 py-1.5 w-fit">
                <span>📞</span>
                <span>{user.phone}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
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
        {location.city && !location.loading && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 rounded-xl px-4 py-2">
            <span>📍</span>
            <span>Ваш город: <strong>{location.city}</strong></span>
          </div>
        )}
      </div>

      <div className="px-6 -mt-4">
        <input type="text" placeholder={t[lang].search} className="w-full px-6 py-4 rounded-3xl bg-white shadow text-base focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {user && (
        <div className="px-6 mt-4">
          <Link href="/offers"><button className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"><span>📋</span><span>{t[lang].myOrders}</span></button></Link>
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
            <div className="flex justify-between items-center mb-5"><h2 className="font-bold text-xl">{t[lang].preferences}</h2><button className="text-emerald-600 text-sm">{t[lang].filter}</button></div>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (<CategoryCard key={category.id} name={lang === 'kz' ? category.nameKz : category.nameRu} emoji={category.emoji} isSelected={selectedCategories.includes(category.id)} onClick={() => handleCategoryClick(category.id)} lang={lang} />))}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-bold text-xl mb-5">🔥 {t[lang].nearbyOffers}</h2>
            <div className="space-y-6">
              {suppliers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl">
                  <div className="text-6xl mb-4">😢</div>
                  <p className="text-gray-500">{t[lang].noOffers}</p>
                </div>
              ) : (
                suppliers.flatMap(supplier =>
                  supplier.surprise_bags.map(bag => (
                    <OfferCard
                      key={bag.id}
                      id={bag.id}
                      name={bag.name}
                      businessName={supplier.business_name}
                      distance={`${supplier.distance_km} км`}
                      price={bag.discounted_price}
                      originalPrice={bag.original_price}
                      discount={bag.discount_percentage}
                      imageUrl={bag.image_url}
                    />
                  ))
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}