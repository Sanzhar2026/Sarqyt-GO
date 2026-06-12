// app/offers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '../layout';

interface SurpriseItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

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
  items?: SurpriseItem[];
}

export default function OffersPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
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
        setBags(prev => prev.map(bag => 
          bag.id === bagId 
            ? { ...bag, items: data.items || [] }
            : bag
        ));
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
      const bag = bags.find(b => b.id === bagId);
      if (bag && !bag.items) {
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
              pickup_end_time: pickupEnd,
              items: []
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
            pickup_end_time: '20:30',
            items: []
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-KZ') + ' ₸';
  };

  const getReviewText = (count: number) => {
    if (lang === 'kz') {
      return 'баға';
    } else {
      if (count % 10 === 1 && count % 100 !== 11) return 'оценка';
      if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'оценки';
      return 'оценок';
    }
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

  const SurpriseIcon = () => (
    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );

  const HeartIcon = ({ isFavorite }: { isFavorite: boolean }) => (
    <svg className={`w-3.5 h-3.5 ${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

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
      <div className="bg-[#367666] text-white px-4 pt-12 pb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            {lang === 'kz' ? 'Сюрприз-пакеттер' : 'Сюрприз-пакеты'}
          </h1>
          <div className="w-12"></div>
        </div>
        <p className="text-emerald-100 text-xs mt-1">
          {lang === 'kz' ? 'Өзіңізге сюрприз-пакетті таңдаңыз' : 'Выберите свой сюрприз-пакет'}
        </p>
      </div>

      <div className="px-3 py-4">
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
          <div className="space-y-3">
            {bags.map((bag) => {
              const isExpanded = expandedId === bag.id;
              const hasItems = bag.items && bag.items.length > 0;
              const isLoading = loadingItems === bag.id;
              
              return (
                <div 
                  key={bag.id} 
                  className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${
                    isExpanded ? 'pb-3' : ''
                  }`}
                >
                  <div 
                    className="relative w-full cursor-pointer"
                    style={{ height: isExpanded ? 'auto' : '160px' }}
                    onClick={() => handleImageClick(bag.id)}
                  >
                    <div className="relative h-40">
                      <Image
                        src={getFoodImage(bag.name)}
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
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                        <SurpriseIcon />
                        <span className="text-white text-[10px] font-bold">{bag.available_quantity}</span>
                      </div>
                      {bag.available_quantity <= 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-[10px] px-2 py-1 bg-red-600 rounded-full">
                            {lang === 'kz' ? 'Таусылған' : 'Распродано'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-[#367666] text-xs font-bold">
                      {bag.supplier_name}
                    </p>
                    
                    <h3 className="font-bold text-gray-800 text-sm mt-0.5">
                      {bag.name}
                    </h3>
                    
                    {/* Адрес и время на одной линии */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-gray-500 text-[10px]">
                        {bag.address || 'Адрес не указан'}
                      </span>
                      <span className="text-gray-300 text-[10px]">•</span>
                      <span className="text-gray-500 text-[10px]">
                        {bag.pickup_start_time && bag.pickup_end_time 
                          ? `${bag.pickup_start_time}-${bag.pickup_end_time}`
                          : 'Время не указано'}
                      </span>
                    </div>
                    
                    {/* Рейтинг и количество оценок на одной линии */}
                    <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-100">
                      <span className="font-extrabold text-gray-800 text-xs">
                        {bag.rating?.toFixed(1) || '0'}
                      </span>
                      <span className="text-yellow-400 text-[10px]">★</span>
                      {bag.total_reviews && bag.total_reviews > 0 && (
                        <span className="text-gray-400 text-[9px]">
                          {bag.total_reviews} {getReviewText(bag.total_reviews)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                      <span className="text-base font-extrabold text-[#367666]">
                        {formatPrice(bag.discounted_price)}
                      </span>
                      
                      <button
                        onClick={() => addToCart(bag)}
                        disabled={bag.available_quantity <= 0 || addingId === bag.id}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] transition ${
                          bag.available_quantity <= 0 || addingId === bag.id
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#367666] text-white hover:bg-[#2a5a4d]'
                        }`}
                      >
                        {addingId === bag.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          lang === 'kz' ? 'Тапсырыс беру' : 'Заказать'
                        )}
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 pt-2 border-t border-gray-100 animate-fadeIn">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1.5">Состав сюрприза:</p>
                        {isLoading ? (
                          <div className="flex justify-center py-3">
                            <div className="w-4 h-4 border-2 border-[#367666] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : hasItems ? (
                          <div className="space-y-1.5">
                            {bag.items!.slice(0, 4).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-base">{getProductIcon(item.name)}</span>
                                <span className="text-gray-700 text-[10px] flex-1">{item.name}</span>
                                <span className="text-gray-500 text-[9px]">×{item.quantity}</span>
                                <span className="text-gray-700 text-[10px] font-medium">
                                  {(item.price * item.quantity).toLocaleString()} ₸
                                </span>
                              </div>
                            ))}
                            {bag.items!.length > 4 && (
                              <p className="text-[9px] text-gray-400 text-center pt-1">
                                +{bag.items!.length - 4} еще
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 text-center py-2">Состав не указан</p>
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