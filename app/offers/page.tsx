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
  pickup_start_time?: string;
  pickup_end_time?: string;
  address?: string;
}

export default function OffersPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Получение токена
  const getAuthToken = () => sessionStorage.getItem('authToken');

  // Загрузка избранного из localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Сохранение избранного в localStorage
  const toggleFavorite = (bagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    let newFavorites;
    if (favorites.includes(bagId)) {
      newFavorites = favorites.filter(id => id !== bagId);
    } else {
      newFavorites = [...favorites, bagId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

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

  // Загрузка сюрпризов с их рейтингами и дополнительной информацией
  const fetchBags = async () => {
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/surprise-bags');
      const data = await response.json();
      
      // Загружаем рейтинги и доп. инфо для каждого сюрприза
      const bagsWithDetails = await Promise.all(
        data.map(async (bag: SurpriseBag) => {
          try {
            // Загружаем рейтинг
            const ratingRes = await fetch(`https://toogood-2ncf.onrender.com/api/surprise-bags/${bag.id}/rating`);
            let rating = 0, total_reviews = 0;
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              rating = ratingData.rating || 0;
              total_reviews = ratingData.total_reviews || 0;
            }
            
            // Загружаем информацию о поставщике (адрес, время работы)
            const supplierRes = await fetch(`https://toogood-2ncf.onrender.com/api/suppliers/${bag.supplier_id}`);
            let address = '', pickupStart = '', pickupEnd = '';
            if (supplierRes.ok) {
              const supplierData = await supplierRes.json();
              address = supplierData.address || '';
              pickupStart = supplierData.pickup_start_time || '19:30';
              pickupEnd = supplierData.pickup_end_time || '20:30';
            }
            
            return { 
              ...bag, 
              rating: rating, 
              total_reviews: total_reviews,
              address: address,
              pickup_start_time: pickupStart,
              pickup_end_time: pickupEnd
            };
          } catch (e) {
            console.error('Error fetching details:', e);
          }
          return { 
            ...bag, 
            rating: 0, 
            total_reviews: 0,
            address: '',
            pickup_start_time: '19:30',
            pickup_end_time: '20:30'
          };
        })
      );
      
      setBags(bagsWithDetails);
    } catch (error) {
      console.error('Error fetching bags:', error);
    } finally {
      setLoading(false);
    }
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
    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const HeartIcon = ({ isFavorite }: { isFavorite: boolean }) => (
    <svg className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  // Фото еды вместо сюрприза
  const getFoodImage = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('пицц') || lowerName.includes('pizza')) {
      return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop';
    }
    if (lowerName.includes('бургер') || lowerName.includes('burger')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
    }
    if (lowerName.includes('суши') || lowerName.includes('sushi') || lowerName.includes('ролл')) {
      return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop';
    }
    if (lowerName.includes('салат') || lowerName.includes('salad')) {
      return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop';
    }
    if (lowerName.includes('десерт') || lowerName.includes('dessert') || lowerName.includes('торт')) {
      return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  };

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
          <div className="grid grid-cols-1 gap-3">
            {bags.map((bag) => (
              <div key={bag.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex">
                {/* Изображение - 50% */}
                <div className="relative w-1/2 flex-shrink-0">
                  <div className="relative h-28">
                    <Image
                      src={getFoodImage(bag.name)}
                      alt={bag.name}
                      fill
                      className="object-cover"
                    />
                    {/* Сердечко справа вверху на изображении */}
                    <button
                      onClick={(e) => toggleFavorite(bag.id, e)}
                      className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm rounded-full p-1 z-10"
                    >
                      <HeartIcon isFavorite={favorites.includes(bag.id)} />
                    </button>
                    {/* Иконка пакетика с количеством слева вверху на изображении */}
                    <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1">
                      <SurpriseIcon />
                      <span className="text-white text-[10px] font-bold">{bag.available_quantity}</span>
                    </div>
                    {bag.available_quantity <= 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-[10px] px-1.5 py-0.5 bg-red-600 rounded-full">
                          {lang === 'kz' ? 'Таусылған' : 'Распродано'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Контент - 50% */}
                <div className="w-1/2 p-2 flex flex-col justify-between">
                  <div>
                    {/* Название кафе */}
                    <p className="text-[#367666] text-[11px] font-bold truncate">
                      {bag.supplier_name}
                    </p>
                    
                    {/* Название сюрприза */}
                    <h3 className="font-bold text-gray-800 text-xs mt-0.5 truncate">
                      {bag.name}
                    </h3>
                    
                    {/* Адрес без иконки */}
                    <p className="text-gray-500 text-[9px] mt-1 truncate">
                      {bag.address || 'Адрес не указан'}
                    </p>
                    
                    {/* Время работы с иконкой */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <ClockIcon />
                      <span className="text-gray-500 text-[9px]">
                        {bag.pickup_start_time && bag.pickup_end_time 
                          ? `${bag.pickup_start_time}-${bag.pickup_end_time}`
                          : 'Время не указано'}
                      </span>
                    </div>
                    
                    {/* Рейтинг */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="font-extrabold text-gray-800 text-xs">
                        {bag.rating?.toFixed(1) || '0'}
                      </span>
                      <span className="text-yellow-400 text-[10px]">★</span>
                      {bag.total_reviews && bag.total_reviews > 0 && (
                        <span className="text-gray-400 text-[9px]">
                          ({bag.total_reviews} {getReviewText(bag.total_reviews)})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Цена и кнопка */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                    <div>
                      <span className="text-sm font-extrabold text-[#367666]">
                        {formatPrice(bag.discounted_price)}
                      </span>
                      {bag.original_price > bag.discounted_price && (
                        <span className="text-gray-400 line-through text-[8px] ml-0.5">
                          {formatPrice(bag.original_price)}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => addToCart(bag)}
                      disabled={bag.available_quantity <= 0 || addingId === bag.id}
                      className={`px-2 py-0.5 rounded-lg font-bold text-[9px] transition ${
                        bag.available_quantity <= 0 || addingId === bag.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#367666] text-white hover:bg-[#2a5a4d]'
                      }`}
                    >
                      {addingId === bag.id ? (
                        <span className="flex items-center gap-0.5">
                          <div className="w-1.5 h-1.5 border-1.5 border-white border-t-transparent rounded-full animate-spin"></div>
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