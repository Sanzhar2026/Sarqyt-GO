// app/offers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '../layout';

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
  rating?: number;
  total_reviews?: number;
}


export default function OffersPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  // Получение токена
  const getAuthToken = () => sessionStorage.getItem('authToken');

  // Авторизованный fetch
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      console.error('Нет токена');
      router.push('/login');
      throw new Error('No token');
    }
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  // Загрузка сюрпризов с их рейтингами
  const fetchBags = async () => {
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/surprise-bags');
      const data = await response.json();
      
      // Загружаем рейтинги для каждого сюрприза
      const bagsWithRatings = await Promise.all(
        data.map(async (bag: SurpriseBag) => {
          try {
            const ratingRes = await fetch(`https://toogood-2ncf.onrender.com/api/surprise-bags/${bag.id}/rating`);
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              return { 
                ...bag, 
                rating: ratingData.rating || 0, 
                total_reviews: ratingData.total_reviews || 0
              };
            }
          } catch (e) {
            console.error('Error fetching rating:', e);
          }
          return { ...bag, rating: 0, total_reviews: 0 };
        })
      );
      
      setBags(bagsWithRatings);
    } catch (error) {
      console.error('Error fetching bags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Отображение звезд рейтинга
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-400 text-sm">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400 text-sm">½</span>);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300 text-sm">★</span>);
    }
    return stars;
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    fetchBags();
    const interval = setInterval(fetchBags, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = async (bag: SurpriseBag) => {
    if (bag.available_quantity <= 0) {
      alert(lang === 'kz' ? 'Бұл сюрприз таусылған' : 'Этот сюрприз закончился');
      return;
    }

    setAddingId(bag.id);
    
    try {
      const response = await authFetch('https://toogood-2ncf.onrender.com/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ bag_id: bag.id, quantity: 1 })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === bag.id);
        
        if (existing) {
          existing.quantity += 1;
          existing.reservation_id = data.reservation_id;
          existing.expires_at = data.expires_at;
        } else {
          cart.push({
            id: bag.id,
            name: bag.name,
            businessName: bag.supplier_name,
            price: bag.discounted_price,
            originalPrice: bag.original_price,
            discount: bag.discount_percentage,
            imageUrl: bag.image_url,
            quantity: 1,
            reservation_id: data.reservation_id,
            expires_at: data.expires_at
          });
        }
        
        sessionStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        
        const message = lang === 'kz' 
          ? `✅ ${bag.name} себетке қосылды! Төлеуге 15 минут бар.` 
          : `✅ ${bag.name} добавлен в корзину! У вас 15 минут на оплату.`;
        alert(message);
        router.push('/cart');
      } else {
        alert(data.detail || data.message || 'Ошибка при добавлении');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка соединения с сервером');
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-KZ') + ' ₸';
  };

  const getReviewText = (count: number) => {
    if (lang === 'kz') {
      if (count % 10 === 1 && count % 100 !== 11) return 'баға';
      return 'баға';
    } else {
      if (count % 10 === 1 && count % 100 !== 11) return 'оценка';
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'оценки';
      return 'оценок';
    }
  };

  const SurpriseIcon = () => (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#367666] text-white px-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {lang === 'kz' ? 'Сюрприз-пакеттер' : 'Сюрприз-пакеты'}
            </h1>
            <SurpriseIcon />
          </div>
          <div className="w-16"></div>
        </div>
        <p className="text-emerald-100 text-sm mt-1">
          {lang === 'kz' ? 'Өзіңізге сюрприз-пакетті таңдаңыз' : 'Выберите свой сюрприз-пакет'}
        </p>
      </div>

      {/* Bags Grid */}
      <div className="px-4 py-6">
        {bags.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              <SurpriseIcon />
            </div>
            <p className="text-gray-500">
              {lang === 'kz' ? 'Барлық пакеттер уақытша броньдалған' : 'Все пакеты временно забронированы'}
            </p>
            <button 
              onClick={fetchBags}
              className="mt-4 text-[#367666] underline"
            >
              {lang === 'kz' ? 'Жаңарту' : 'Обновить'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bags.map((bag) => (
              <div key={bag.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={bag.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                    alt={bag.name}
                    fill
                    className="object-cover"
                  />
                  {bag.discount_percentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{bag.discount_percentage}%
                    </div>
                  )}
                  {bag.available_quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm px-3 py-1 bg-red-600 rounded-full">
                        {lang === 'kz' ? 'Таусылған' : 'Распродано'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <p className="text-[#367666] text-sm font-medium">
                    {bag.supplier_name}
                  </p>
                  
                  <h3 className="font-bold text-gray-800 text-lg">
                    {bag.name}
                  </h3>
                  
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{bag.description}</p>
                  
                  {/* ТОЛЬКО рейтинг - звезды и количество оценок */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-0.5">
                      {renderStars(bag.rating || 0)}
                    </div>
                    {bag.total_reviews && bag.total_reviews > 0 && (
                      <span className="text-xs text-gray-500">
                        ({bag.total_reviews} {getReviewText(bag.total_reviews)})
                      </span>
                    )}
                  </div>
                  
                  {/* Цена и кнопка */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-xl font-bold text-[#367666]">
                        {formatPrice(bag.discounted_price)}
                      </span>
                      {bag.original_price > bag.discounted_price && (
                        <span className="text-gray-400 line-through text-sm ml-2">
                          {formatPrice(bag.original_price)}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => addToCart(bag)}
                      disabled={bag.available_quantity <= 0 || addingId === bag.id}
                      className={`px-6 py-2 rounded-xl font-semibold transition ${
                        bag.available_quantity <= 0 || addingId === bag.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#367666] text-white hover:bg-[#2a5a4d]'
                      }`}
                    >
                      {addingId === bag.id ? (
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {lang === 'kz' ? 'Қосылуда...' : 'Добавление...'}
                        </span>
                      ) : (
                        lang === 'kz' ? 'Тапсырыс беру' : 'Заказать'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}