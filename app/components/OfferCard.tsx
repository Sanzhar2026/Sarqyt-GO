// app/components/OfferCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface SurpriseItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

interface OfferCardProps {
  id: number;
  name: string;
  businessName: string;
  distance: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  onOrderSuccess?: () => void;
}

export default function OfferCard({
  id,
  name: propName,
  businessName,
  distance,
  price: propPrice,
  originalPrice: propOriginalPrice,
  discount: propDiscount,
  imageUrl: propImageUrl,
  description: propDescription,
  rating = 4.5,
  reviewCount = 128,
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [bagItems, setBagItems] = useState<SurpriseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Рейтинг
  const [bagRating, setBagRating] = useState(0);
  const [bagTotalReviews, setBagTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';
  
  const isSearchPage = pathname === '/' || pathname === '/offers' || pathname?.startsWith('/offers');

  // Загружаем состав сюрприза
  const fetchBagItems = async () => {
    if (bagItems.length > 0) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/surprise-bags/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBagItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching bag items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем рейтинг
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`${API_URL}/api/surprise-bags/${id}/rating`, { headers });
        if (response.ok) {
          const data = await response.json();
          setBagRating(data.rating || 0);
          setBagTotalReviews(data.total_reviews || 0);
          setUserRating(data.user_rating);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };
    fetchRating();
  }, [id, API_URL]);

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/me`);
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        if (data.token) sessionStorage.setItem('authToken', data.token);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [API_URL]);

  // Проверка избранного
  useEffect(() => {
    const favorites = localStorage.getItem('favorites');
    if (favorites) {
      const favList = JSON.parse(favorites);
      setIsFavorite(favList.includes(id));
    }
  }, [id]);

  // Клик по картинке
  const handleImageClick = async () => {
    if (isSearchPage) {
      if (!showDetails && bagItems.length === 0) {
        await fetchBagItems();
      }
      setShowDetails(!showDetails);
    }
  };

  // Оценка сюрприза
  const rateSurpriseBag = async (rating: number) => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }
    
    setIsRatingLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/surprise-bags/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBagRating(data.rating);
        setBagTotalReviews(data.total_reviews);
        setUserRating(rating);
      }
    } catch (error) {
      console.error('Error rating:', error);
    } finally {
      setIsRatingLoading(false);
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = localStorage.getItem('favorites');
    let favList: number[] = favorites ? JSON.parse(favorites) : [];
    
    if (isFavorite) {
      favList = favList.filter(favId => favId !== id);
    } else {
      favList.push(id);
    }
    localStorage.setItem('favorites', JSON.stringify(favList));
    setIsFavorite(!isFavorite);
  };

  const addToCart = async () => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    setAddingToCart(true);
    const token = sessionStorage.getItem('authToken');

    try {
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bag_id: id, quantity: 1 })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === id);
        
        const cartItem = {
          id, name: propName, businessName,
          price: propPrice, originalPrice: propOriginalPrice,
          discount: propDiscount, imageUrl: propImageUrl,
          quantity: 1, description: propDescription,
          totalItems: bagItems.length || 1,
          reservation_id: data.reservation_id,
          expires_at: data.expires_at
        };
        
        if (existing) {
          existing.quantity += 1;
          existing.reservation_id = data.reservation_id;
          existing.expires_at = data.expires_at;
        } else {
          cart.push(cartItem);
        }
        
        sessionStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        if (onOrderSuccess) onOrderSuccess();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  // Функция для иконки продукта
  const getProductIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('пицц') || lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('бургер') || lowerName.includes('burger')) return '🍔';
    if (lowerName.includes('суши') || lowerName.includes('sushi') || lowerName.includes('ролл')) return '🍣';
    if (lowerName.includes('салат') || lowerName.includes('salad')) return '🥗';
    if (lowerName.includes('кола') || lowerName.includes('coca') || lowerName.includes('cola')) return '🥤';
    if (lowerName.includes('лимонад') || lowerName.includes('lemonade')) return '🧃';
    if (lowerName.includes('сок') || lowerName.includes('juice')) return '🧃';
    if (lowerName.includes('картошк') || lowerName.includes('fries')) return '🍟';
    if (lowerName.includes('крилс') || lowerName.includes('wings')) return '🍗';
    if (lowerName.includes('сыр') || lowerName.includes('cheese')) return '🧀';
    if (lowerName.includes('десерт') || lowerName.includes('dessert')) return '🍰';
    if (lowerName.includes('торт') || lowerName.includes('cake')) return '🎂';
    if (lowerName.includes('морожен') || lowerName.includes('ice cream')) return '🍦';
    return '🍽️';
  };

  if (!authChecked) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-32 bg-gray-200"></div>
        <div className="p-3">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalItems = bagItems.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Изображение */}
      <div 
        className="relative w-full cursor-pointer" 
        style={{ height: '140px' }}
        onClick={handleImageClick}
      >
        <Image 
          src={propImageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'} 
          alt={propName} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        <button
          onClick={toggleFavorite}
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm z-10"
        >
          <svg className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-500'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        <div className="absolute top-2 left-2 flex gap-1.5">
          {propDiscount > 0 && (
            <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              -{propDiscount}%
            </div>
          )}
          <div className="bg-[#367666] text-white px-2 py-0.5 rounded-full text-xs font-bold">
            {totalItems} шт
          </div>
        </div>
      </div>
      
      {/* Контент */}
      <div className="p-3">
        {/* Название кафе - жирное */}
        <Link href={`/supplier/${id}`}>
          <p className="font-extrabold text-gray-800 text-base hover:text-[#367666] transition mb-1">
            {businessName}
          </p>
        </Link>
        
        {/* Название сюрприза - жирное */}
        <h3 className="font-bold text-gray-800 text-md mb-1">
          {propName}
        </h3>
        
        {/* Адрес и время работы */}
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
          <span className="flex items-center gap-1">📍 {distance}</span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1">🕒 19:30 - 20:30</span>
        </div>
        
        {/* Описание */}
        <p className="text-gray-500 text-xs mb-2 line-clamp-1">{propDescription}</p>
        
        {/* Состав сюрприза (при клике) */}
        {isSearchPage && showDetails && (
          <div className="mb-3 p-2 bg-gray-50 rounded-xl">
            {loading ? (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 border-2 border-[#367666] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bagItems.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-gray-700 mb-1">Состав:</p>
                {bagItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1">
                    <span className="text-base">{getProductIcon(item.name)}</span>
                    <span className="text-gray-700 text-sm font-medium flex-1">{item.name}</span>
                    <span className="text-gray-500 text-xs">×{item.quantity}</span>
                    <span className="text-gray-700 text-sm font-semibold">{(item.price * item.quantity).toLocaleString()} ₸</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-[#367666] font-semibold">
                    💰 Экономия: {propDiscount}% ({(propOriginalPrice - propPrice).toLocaleString()} ₸)
                  </p>
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">Состав не указан</p>
            )}
          </div>
        )}
        
        {/* Рейтинг (число + звезды + количество голосов) */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-extrabold text-gray-800 text-lg">{bagRating.toFixed(1)}</span>
          <span className="text-yellow-400 text-base">★</span>
          <span className="text-gray-400 text-xs">({bagTotalReviews} {getReviewText(bagTotalReviews)})</span>
        </div>
        
        {/* Цена + кнопка Заказать */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <span className="text-xl font-extrabold text-[#367666]">{propPrice.toLocaleString()} ₸</span>
            {propOriginalPrice > propPrice && (
              <span className="text-gray-400 line-through text-xs ml-2">{propOriginalPrice.toLocaleString()} ₸</span>
            )}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#2a5a4d] disabled:opacity-50 transition"
          >
            {addingToCart ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Заказать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getReviewText(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) return 'оценка';
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'оценки';
  return 'оценок';
}