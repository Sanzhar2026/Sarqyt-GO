// components/HomeClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNearbyBags, type Supplier } from '../lib/api';
import CategoryCard from './components/CategoryCard';
import OfferCard from './components/OfferCard';

type Tab = 'preferences' | 'discover';
type Language = 'kz' | 'ru';

export default function HomeClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('kz');
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; id: number } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; address: string } | null>(null);

  // Mark component as mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Translations
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

  // Categories with emoji only
  const categories = [
    { id: 'kazakh', nameKz: 'Қазақ тағамы', nameRu: 'Казахская кухня', emoji: '🍖' },
    { id: 'fastfood', nameKz: 'Фастфуд', nameRu: 'Фастфуд', emoji: '🍔' },
    { id: 'pizza', nameKz: 'Пицца', nameRu: 'Пицца', emoji: '🍕' },
    { id: 'healthy', nameKz: 'Здоровое питание', nameRu: 'Здоровое питание', emoji: '🥗' },
    { id: 'asian', nameKz: 'Азия тағамы', nameRu: 'Азиатская кухня', emoji: '🍜' },
    { id: 'desserts', nameKz: 'Тәттілер', nameRu: 'Десерты', emoji: '🍰' }
  ];

  // Load language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && (savedLang === 'kz' || savedLang === 'ru')) {
      setLang(savedLang);
    }
  }, []);

  // Save language to localStorage
  const toggleLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('https://toogood-2ncf.onrender.com/api/check-auth', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) setUser({ name: data.user_name, id: data.user_id });
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkAuth();
  }, []);

  // Get location and load suppliers
  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        
        try {
          const addressRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${lang === 'kz' ? 'kk' : 'ru'}`
          );
          const addressData = await addressRes.json();
          const address = addressData.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setUserLocation({ lat, lon, address });

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
  }, [lang]);

  const handleLogout = async () => {
    await fetch('https://toogood-2ncf.onrender.com/logout', { method: 'GET', credentials: 'include' });
    setUser(null);
    router.refresh();
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Don't render anything until mounted (no hydration mismatch)
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Language Switcher INSIDE */}
      <div className="bg-emerald-600 text-white px-6 pt-8 pb-8">
        {/* Language Switcher - inside header, on the right */}
        <div className="flex justify-end mb-4">
          <div className="bg-white/20 rounded-full p-1 flex gap-1">
            <button
              onClick={() => toggleLanguage('kz')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                lang === 'kz'
                  ? 'bg-white text-emerald-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Қаз
            </button>
            <button
              onClick={() => toggleLanguage('ru')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                lang === 'ru'
                  ? 'bg-white text-emerald-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Рус
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              {t[lang].greeting}, {user ? user.name : t[lang].guest}! 👋
            </h1>
            <p className="text-emerald-100 mt-1">{t[lang].subtitle}</p>
          </div>
          
          <div className="flex gap-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl text-sm transition flex items-center gap-2"
              >
                <span>🚪</span>
                <span>{t[lang].logout}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-2xl text-sm transition">
                    {t[lang].login}
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="bg-white/30 hover:bg-white/40 px-4 py-2 rounded-2xl text-sm transition">
                    {t[lang].register}
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Location info */}
        {userLocation && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 rounded-xl px-4 py-2">
            <span>📍</span>
            <span className="truncate">
              {userLocation.address.length > 50 
                ? userLocation.address.substring(0, 50) + '...' 
                : userLocation.address}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-6 -mt-4">
        <input
          type="text"
          placeholder={t[lang].search}
          className="w-full px-6 py-4 rounded-3xl bg-white shadow text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* My Orders Link (only if logged in) */}
      {user && (
        <div className="px-6 mt-4">
          <Link href="/my-orders">
            <button className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <span>📋</span>
              <span>{t[lang].myOrders}</span>
            </button>
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 mt-6">
        <div className="bg-gray-100 p-1 rounded-3xl flex">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-3 rounded-3xl font-semibold text-sm transition-all ${
              activeTab === 'preferences' 
                ? 'bg-white shadow text-emerald-600' 
                : 'text-gray-500'
            }`}
          >
            {t[lang].preferences}
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-3 rounded-3xl font-semibold text-sm transition-all ${
              activeTab === 'discover' 
                ? 'bg-white shadow text-emerald-600' 
                : 'text-gray-500'
            }`}
          >
            {t[lang].discover}
          </button>
        </div>
      </div>

      {/* Content */}
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
                      lang={lang}
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