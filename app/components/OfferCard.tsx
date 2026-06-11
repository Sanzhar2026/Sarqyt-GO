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

  // Клик по картинке - переключает детали и размер карточки
  const handleImageClick = async () => {
    if (isSearchPage) {
      if (!showDetails && bagItems.length === 0) {
        await fetchBagItems();
      }
      setShowDetails(!showDetails);
    }
  };

  // Оценка сюрприза
  const rateSurpriseBag = async (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
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
        showNotification('Спасибо за оценку!', 'success');
      } else {
        showNotification(data.message || 'Ошибка при оценке', 'error');
      }
    } catch (error) {
      console.error('Error rating:', error);
      showNotification('Ошибка при оценке', 'error');
    } finally {
      setIsRatingLoading(false);
    }
  };

  // Звезды
  const renderBagStars = (interactive = false) => {
    const stars = [];
    const currentRating = interactive ? (userRating || 0) : bagRating;
    
    for (let i = 1; i <= 5; i++) {
      if (interactive) {
        stars.push(
          <button
            key={i}
            onClick={(e) => rateSurpriseBag(i, e)}
            disabled={isRatingLoading || userRating !== null}
            className={`text-xs transition-all ${userRating !== null ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} ${i <= currentRating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        );
      } else {
        stars.push(
          <span key={i} className={`text-xs ${i <= currentRating ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        );
      }
    }
    return stars;
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = localStorage.getItem('favorites');
    let favList: number[] = favorites ? JSON.parse(favorites) : [];
    
    if (isFavorite) {
      favList = favList.filter(favId => favId !== id);
      showNotification('Удалено из избранного', 'info');
    } else {
      favList.push(id);
      showNotification('Добавлено в избранное', 'success');
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
        showNotification(data.detail || 'Товар временно недоступен', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Ошибка соединения', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-4 right-4 z-50 p-3 rounded-xl text-white text-center animate-slide-up text-sm ${
      type === 'success' ? 'bg-[#367666]' : type === 'error' ? 'bg-red-600' : 'bg-gray-800'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const renderStarsForSupplier = () => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-400 text-xs">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400 text-xs">½</span>);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300 text-xs">★</span>);
    }
    return stars;
  };

  if (!authChecked) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalItems = bagItems.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div 
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${
        showDetails ? 'scale-100' : ''
      }`}
      style={{ 
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Изображение - 70% от текущей высоты карточки */}
      <div 
        className="relative w-full cursor-pointer flex-shrink-0" 
        style={{ height: showDetails ? '200px' : '220px' }}
        onClick={handleImageClick}
      >
        <Image 
          src={propImageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'} 
          alt={propName} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
      
      {/* Контент - анимированная высота */}
      <div 
        className="p-3 flex-1 flex flex-col justify-between overflow-hidden transition-all duration-300"
        style={{ 
          minHeight: showDetails ? 'auto' : '140px'
        }}
      >
        <div>
          <Link href={`/supplier/${id}`}>
            <p className="font-bold text-gray-800 text-sm hover:text-[#367666] transition mb-0.5 line-clamp-1">
              {businessName}
            </p>
          </Link>
          
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {renderBagStars(false)}
              </div>
              {bagTotalReviews > 0 && (
                <span className="text-[10px] text-gray-500">({bagTotalReviews})</span>
              )}
            </div>
            <p className="text-gray-400 text-[10px]">{distance}</p>
          </div>
          
          {userRating === null ? (
            <div className="flex items-center gap-0.5 mb-0.5">
              <span className="text-[10px] text-gray-400">Оценить:</span>
              <div className="flex items-center gap-0.5">
                {renderBagStars(true)}
              </div>
            </div>
          ) : (
            <div className="mb-0.5">
              <span className="text-[10px] text-green-600">✓ Вы оценили на {userRating} ★</span>
            </div>
          )}
          
          <h3 className="font-semibold text-xs mb-0.5 line-clamp-1">
            {propName}
          </h3>
          
          <p className="text-gray-500 text-[10px] mb-1 line-clamp-1">{propDescription}</p>
          
          {/* Состав - появляется/исчезает с анимацией */}
          {isSearchPage && showDetails && (
            <div className="mt-2 mb-1 p-2 bg-gray-50 rounded-lg animate-fadeIn">
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="w-4 h-4 border-2 border-[#367666] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : bagItems.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Состав сюрприза:</p>
                  {bagItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600">{item.name} ×{item.quantity}</span>
                      <span className="font-medium text-gray-700">{(item.price * item.quantity).toLocaleString()} ₸</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-1 border-t border-gray-200">
                    <p className="text-xs text-[#367666] font-medium">
                      Экономия: {propDiscount}% ({(propOriginalPrice - propPrice).toLocaleString()} ₸)
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">Состав не указан</p>
              )}
            </div>
          )}
        </div>
        
        {/* Цена и кнопка - всегда видимы */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div>
            <span className="text-base font-bold text-[#367666]">{propPrice.toLocaleString()} ₸</span>
            {propOriginalPrice > propPrice && (
              <span className="text-gray-400 line-through text-[10px] ml-1">{propOriginalPrice.toLocaleString()} ₸</span>
            )}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-[#2a5a4d] disabled:opacity-50 transition"
          >
            {addingToCart ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'В корзину'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}