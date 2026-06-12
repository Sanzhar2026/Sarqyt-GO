// app/components/SurpriseBagCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SurpriseBagCardProps {
  id: number;
  name: string;
  supplierName: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  description?: string;
  availableQuantity: number;
  address?: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  rating?: number;
  totalReviews?: number;
  onOrderSuccess?: () => void;
}

export default function SurpriseBagCard({
  id,
  name,
  supplierName,
  price,
  originalPrice,
  discount,
  imageUrl,
  description,
  availableQuantity,
  address,
  pickupStartTime,
  pickupEndTime,
  rating = 0,
  totalReviews = 0,
  onOrderSuccess
}: SurpriseBagCardProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [bagRating, setBagRating] = useState(rating);
  const [bagTotalReviews, setBagTotalReviews] = useState(totalReviews);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Загружаем рейтинг
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
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
      }
    } catch (error) {
      console.error('Error rating:', error);
    } finally {
      setIsRatingLoading(false);
    }
  };

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

    if (availableQuantity <= 0) {
      alert('Этот сюрприз закончился');
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
          id, name, businessName: supplierName,
          price, originalPrice, discount, imageUrl,
          quantity: 1, description,
          totalItems: 1,
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
        alert(`✅ ${name} добавлен в корзину!`);
        if (onOrderSuccess) onOrderSuccess();
      } else {
        alert(data.detail || 'Ошибка при добавлении');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка соединения с сервером');
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: number) => price.toLocaleString('ru-KZ') + ' ₸';
  
  const getReviewText = (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'оценка';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'оценки';
    return 'оценок';
  };

  if (!authChecked) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-36 bg-gray-200"></div>
        <div className="p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Изображение */}
      <div className="relative h-36">
        <Image 
          src={imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'} 
          alt={name} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        <button
          onClick={toggleFavorite}
          className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5 z-10"
        >
          <svg className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : 'text-white'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        <div className="absolute top-2 left-2 flex gap-1.5">
          {discount > 0 && (
            <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              -{discount}%
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3">
        {/* Название ресторана */}
        <p className="font-bold text-gray-800 text-sm mb-1">
          {supplierName}
        </p>
        
        {/* Звезды рейтинга */}
        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {renderBagStars(false)}
            </div>
            {bagTotalReviews > 0 && (
              <span className="text-xs text-gray-500">({bagTotalReviews})</span>
            )}
          </div>
        </div>
        
        {/* Интерактивные звезды для оценки */}
        {userRating === null && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-gray-400">Оценить:</span>
            <div className="flex items-center gap-0.5">
              {renderBagStars(true)}
            </div>
          </div>
        )}
        
        {userRating !== null && (
          <div className="mb-1">
            <span className="text-xs text-green-600">✓ Вы оценили на {userRating} ★</span>
          </div>
        )}
        
        {/* Название сюрприза */}
        <h3 className="font-semibold text-sm mb-1 line-clamp-1">
          {name}
        </h3>
        
        {/* Адрес и время на одной линии */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-gray-500 text-xs">
            {address || 'Адрес не указан'}
          </span>
          <span className="text-gray-300 text-xs">•</span>
          <span className="text-gray-500 text-xs">
            {pickupStartTime && pickupEndTime ? `${pickupStartTime}-${pickupEndTime}` : 'Время не указано'}
          </span>
        </div>
        
        {/* Описание */}
        <p className="text-gray-500 text-xs mb-2 line-clamp-2">{description}</p>
        
        {/* Цена и кнопка */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-lg font-bold text-[#367666]">{formatPrice(price)}</span>
            {originalPrice > price && (
              <span className="text-gray-400 line-through text-xs ml-1">{formatPrice(originalPrice)}</span>
            )}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#2a5a4d] disabled:opacity-50 transition"
          >
            {addingToCart ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Заказать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}