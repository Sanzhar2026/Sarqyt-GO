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
  
  const [bagRating, setBagRating] = useState(0);
  const [bagTotalReviews, setBagTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [showExpanded, setShowExpanded] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';
  const isSearchPage = pathname === '/' || pathname === '/offers';

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

  // Загрузка состава
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

  const handleIconClick = async () => {
    if (isSearchPage) {
      if (!showExpanded && bagItems.length === 0) {
        await fetchBagItems();
      }
      setShowExpanded(!showExpanded);
    }
  };

  // Оценка сюрприза
  const rateSurpriseBag = async (ratingValue: number) => {
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
        body: JSON.stringify({ rating: ratingValue })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBagRating(data.rating);
        setBagTotalReviews(data.total_reviews);
        setUserRating(ratingValue);
        showNotification('Спасибо за оценку!', 'success');
      }
    } catch (error) {
      console.error('Error rating:', error);
      showNotification('Ошибка при оценке', 'error');
    } finally {
      setIsRatingLoading(false);
    }
  };

  // Звезды рейтинга
  const renderStars = () => {
    const stars = [];
    const currentRating = userRating !== null ? userRating : bagRating;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => rateSurpriseBag(i)}
          onMouseEnter={() => setTempRating(i)}
          onMouseLeave={() => setTempRating(0)}
          className={`text-xs transition-all hover:scale-110 ${i <= (tempRating || currentRating) ? 'text-yellow-400' : 'text-gray-300'}`}
          disabled={isRatingLoading}
        >
          ★
        </button>
      );
    }
    return stars;
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
        showNotification(`✅ ${propName} добавлен в корзину!`, 'success');
        if (onOrderSuccess) onOrderSuccess();
      } else {
        showNotification(data.detail || 'Ошибка при добавлении', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Ошибка соединения', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-4 right-4 z-50 p-3 rounded-xl text-white text-center animate-slide-up text-sm ${
      type === 'success' ? 'bg-[#367666]' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const formatPrice = (priceVal: number) => priceVal.toLocaleString('ru-KZ') + ' ₸';
  
  const getReviewText = (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'оценка';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'оценки';
    return 'оценок';
  };

  // Фото по названию
  const getImageByTitle = () => {
    const title = propName.toLowerCase();
    if (title.includes('пицц') || title.includes('pizza')) {
      return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop';
    }
    if (title.includes('бургер') || title.includes('burger')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
    }
    if (title.includes('суши') || title.includes('sushi') || title.includes('ролл')) {
      return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop';
    }
    if (title.includes('салат') || title.includes('salad')) {
      return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop';
    }
    if (title.includes('десерт') || title.includes('dessert') || title.includes('торт')) {
      return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  };

  if (!authChecked) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-40 bg-gray-200"></div>
        <div className="p-2">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalItems = bagItems.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Изображение */}
      <div className="relative h-40">
        <Image 
          src={getImageByTitle()} 
          alt={propName} 
          fill 
          className="object-cover"
        />
        
        <button
          onClick={toggleFavorite}
          className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 z-10"
        >
          <svg className={`w-3.5 h-3.5 ${isFavorite ? 'text-red-500 fill-current' : 'text-white/80'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        {/* Иконка восклицательного знака */}
        <button 
          onClick={handleIconClick}
          className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1 z-10"
        >
          <svg className="w-3 h-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        <div className="absolute top-2 left-2 flex gap-1.5">
          {propDiscount > 0 && (
            <div className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold">
              -{propDiscount}%
            </div>
          )}
          <div className="bg-[#367666] text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold">
            {totalItems} шт
          </div>
        </div>
      </div>
      
      <div className="p-2">
        <Link href={`/supplier/${id}`}>
          <p className="font-bold text-[#367666] text-xs hover:text-[#2a5a4d] transition mb-0.5">
            {businessName}
          </p>
        </Link>
        
        <h3 className="font-semibold text-gray-800 text-xs mb-1 line-clamp-1">
          {propName}
        </h3>
        
        {/* Адрес - показывается всегда в свернутом виде */}
        <div className="mb-1">
          <div className="text-gray-400 text-[9px] line-clamp-1">
            {distance}
          </div>
        </div>
        
        {/* Рейтинг */}
        <div className="flex items-center justify-between mt-1 mb-1">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {renderStars()}
            </div>
            {bagTotalReviews > 0 && (
              <span className="text-[9px] text-gray-400">({bagTotalReviews} {getReviewText(bagTotalReviews)})</span>
            )}
          </div>
        </div>
        
        {/* Развернутая информация (адрес полностью + состав) */}
        {showExpanded && (
          <div className="mt-1 mb-1 p-1.5 bg-gray-50 rounded-lg">
            {/* Полный адрес */}
            <div className="text-gray-600 text-[9px] mb-1">
              📍 {distance}
            </div>
            
            {/* Состав */}
            {loading ? (
              <div className="flex justify-center py-1">
                <div className="w-3 h-3 border-2 border-[#367666] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bagItems.length > 0 ? (
              <>
                <p className="text-[9px] font-semibold text-gray-700 mb-0.5">Состав:</p>
                {bagItems.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[9px] py-0.5">
                    <span className="text-gray-600">{item.name} ×{item.quantity}</span>
                    <span className="font-medium">{(item.price * item.quantity).toLocaleString()} ₸</span>
                  </div>
                ))}
                {bagItems.length > 2 && <p className="text-[8px] text-gray-400 text-center pt-0.5">+{bagItems.length - 2} еще</p>}
              </>
            ) : (
              <p className="text-[9px] text-gray-400 text-center py-1">Нет информации</p>
            )}
          </div>
        )}
        
        {/* Цена и кнопка */}
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
          <div>
            <span className="text-sm font-bold text-[#367666]">{formatPrice(propPrice)}</span>
            {propOriginalPrice > propPrice && (
              <span className="text-gray-400 line-through text-[8px] ml-1">{formatPrice(propOriginalPrice)}</span>
            )}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-2.5 py-1 rounded-full text-[9px] font-medium hover:bg-[#2a5a4d] disabled:opacity-50 transition"
          >
            {addingToCart ? (
              <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Заказать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}