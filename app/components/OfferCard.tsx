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
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [bagItemsMap, setBagItemsMap] = useState<Map<number, any[]>>(new Map());
  const [loadingItems, setLoadingItems] = useState<number | null>(null);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const getAuthToken = () => sessionStorage.getItem('authToken');

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

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

  const fetchBagItems = async (bagId: number) => {
    if (loadingItems === bagId) return;
    setLoadingItems(bagId);
    try {
      const response = await fetch(`${API_URL}/api/surprise-bags/${bagId}`);
      if (response.ok) {
        const data = await response.json();
        setBagItemsMap(prev => new Map(prev).set(bagId, data.items || []));
      }
    } catch (error) {
      console.error('Error fetching bag items:', error);
    } finally {
      setLoadingItems(null);
    }
  };

  const handleImageClick = async (bagId: number) => {
    if (expandedId === bagId) {
      setExpandedId(null);
    } else {
      if (!bagItemsMap.has(bagId)) {
        await fetchBagItems(bagId);
      }
      setExpandedId(bagId);
    }
  };

  const fetchBags = async () => {
    try {
      const response = await fetch(`${API_URL}/api/surprise-bags`);
      const data = await response.json();
      
      const bagsWithDetails = await Promise.all(
        data.map(async (bag: SurpriseBag) => {
          try {
            const ratingRes = await fetch(`${API_URL}/api/surprise-bags/${bag.id}/rating`);
            let rating = 0, total_reviews = 0;
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              rating = ratingData.rating || 0;
              total_reviews = ratingData.total_reviews || 0;
            }
            
            const supplierRes = await fetch(`${API_URL}/api/suppliers/${bag.supplier_id}`);
            let address = '', pickupStart = '', pickupEnd = '';
            if (supplierRes.ok) {
              const supplierData = await supplierRes.json();
              address = supplierData.address || '';
              pickupStart = supplierData.pickup_start_time || '19:30';
              pickupEnd = supplierData.pickup_end_time || '20:30';
            }
            
            return { 
              ...bag, 
              rating, 
              total_reviews,
              address,
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
    const token = getAuthToken();

    try {
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
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

  const formatPrice = (price: number) => price.toLocaleString('ru-KZ') + ' ₸';
  
  const getReviewText = (count: number) => {
    if (lang === 'kz') return 'баға';
    if (count % 10 === 1 && count % 100 !== 11) return 'оценка';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'оценки';
    return 'оценок';
  };

  const getProductIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('пицц') || lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('бургер') || lowerName.includes('burger')) return '🍔';
    if (lowerName.includes('суши') || lowerName.includes('sushi') || lowerName.includes('ролл')) return '🍣';
    if (lowerName.includes('салат') || lowerName.includes('salad')) return '🥗';
    if (lowerName.includes('кола') || lowerName.includes('coca') || lowerName.includes('cola')) return '🥤';
    if (lowerName.includes('картошк') || lowerName.includes('fries')) return '🍟';
    if (lowerName.includes('крилс') || lowerName.includes('wings')) return '🍗';
    if (lowerName.includes('сыр') || lowerName.includes('cheese')) return '🧀';
    if (lowerName.includes('десерт') || lowerName.includes('dessert')) return '🍰';
    return '🍽️';
  };

  const HeartIcon = ({ isFavorite }: { isFavorite: boolean }) => (
    <svg className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
      <div className="bg-[#367666] text-white px-4 pt-12 pb-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold">
          {lang === 'kz' ? 'Сюрприз-пакеттер' : 'Сюрприз-пакеты'}
        </h1>
        <p className="text-emerald-100 text-xs mt-0.5">
          {lang === 'kz' ? 'Өзіңізге сюрприз-пакетті таңдаңыз' : 'Выберите свой сюрприз-пакет'}
        </p>
      </div>

      <div className="p-4">
        {bags.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              {lang === 'kz' ? 'Барлық пакеттер уақытша броньдалған' : 'Все пакеты временно забронированы'}
            </p>
            <button onClick={fetchBags} className="mt-4 text-[#367666] underline text-sm">
              {lang === 'kz' ? 'Жаңарту' : 'Обновить'}
            </button>
          </div>
        ) : (
          // ОДНА КОЛОНКА - 3 ряда
          <div className="flex flex-col gap-4">
            {bags.slice(0, 3).map((bag) => {
              const isExpanded = expandedId === bag.id;
              const bagItems = bagItemsMap.get(bag.id) || [];
              const isLoading = loadingItems === bag.id;
              
              return (
                <div 
                  key={bag.id} 
                  className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'pb-3' : ''}`}
                >
                  {/* Изображение */}
                  <div 
                    className="relative w-full cursor-pointer"
                    onClick={() => handleImageClick(bag.id)}
                  >
                    <div className="relative h-48">
                      <Image
                        src={bag.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                        alt={bag.name}
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={(e) => toggleFavorite(bag.id, e)}
                        className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 z-10"
                      >
                        <HeartIcon isFavorite={favorites.includes(bag.id)} />
                      </button>
                      {bag.discount_percentage > 0 && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                          -{bag.discount_percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {/* Название кафе */}
                    <p className="text-[#367666] text-sm font-bold">
                      {bag.supplier_name}
                    </p>
                    
                    {/* Название сюрприза */}
                    <h3 className="font-bold text-gray-800 text-base mt-1">
                      {bag.name}
                    </h3>
                    
                    {/* Адрес • Время работы */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-gray-500 text-xs">
                        {bag.address || 'Адрес не указан'}
                      </span>
                      <span className="text-gray-300 text-xs">•</span>
                      <span className="text-gray-500 text-xs">
                        {bag.pickup_start_time && bag.pickup_end_time 
                          ? `${bag.pickup_start_time}-${bag.pickup_end_time}`
                          : 'Время не указано'}
                      </span>
                    </div>
                    
                    {/* Рейтинг и количество оценок */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="font-extrabold text-gray-800 text-sm">
                        {bag.rating?.toFixed(1) || '0'}
                      </span>
                      <span className="text-yellow-400 text-xs">★</span>
                      {bag.total_reviews && bag.total_reviews > 0 && (
                        <span className="text-gray-400 text-[10px]">
                          {bag.total_reviews} {getReviewText(bag.total_reviews)}
                        </span>
                      )}
                    </div>
                    
                    {/* Цена и кнопка */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                      <span className="text-xl font-extrabold text-[#367666]">
                        {formatPrice(bag.discounted_price)}
                      </span>
                      
                      <button
                        onClick={() => addToCart(bag)}
                        disabled={bag.available_quantity <= 0 || addingId === bag.id}
                        className={`px-4 py-1.5 rounded-lg font-bold text-xs transition ${
                          bag.available_quantity <= 0 || addingId === bag.id
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#367666] text-white hover:bg-[#2a5a4d]'
                        }`}
                      >
                        {addingId === bag.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          'Заказать'
                        )}
                      </button>
                    </div>
                    
                    {/* Состав при клике */}
                    {isExpanded && (
                      <div className="mt-3 pt-2 border-t border-gray-100 animate-fadeIn">
                        <p className="text-xs font-semibold text-gray-700 mb-1.5">Состав сюрприза:</p>
                        {isLoading ? (
                          <div className="flex justify-center py-3">
                            <div className="w-4 h-4 border-2 border-[#367666] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : bagItems.length > 0 ? (
                          <div className="space-y-1.5">
                            {bagItems.slice(0, 4).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-base">{getProductIcon(item.name)}</span>
                                <span className="text-gray-700 text-xs flex-1">{item.name}</span>
                                <span className="text-gray-500 text-[10px]">×{item.quantity}</span>
                                <span className="text-gray-700 text-xs font-medium">
                                  {(item.price * item.quantity).toLocaleString()} ₸
                                </span>
                              </div>
                            ))}
                            {bagItems.length > 4 && (
                              <p className="text-[10px] text-gray-400 text-center pt-1">
                                +{bagItems.length - 4} еще
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-2">Состав не указан</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}