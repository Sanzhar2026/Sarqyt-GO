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
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [bagItems, setBagItems] = useState<SurpriseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // ============ ДОБАВЛЯЕМ СОСТОЯНИЯ ДЛЯ РЕЙТИНГА ============
  const [bagRating, setBagRating] = useState(0);
  const [bagTotalReviews, setBagTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';
  
  // Определяем, находимся ли мы на странице поиска (где нужно показывать состав при нажатии)
  const isSearchPage = pathname === '/' || pathname === '/offers';

  // Загружаем состав сюрприза (только для страницы поиска)
  useEffect(() => {
    if (!isSearchPage) {
      setLoading(false);
      return;
    }
    
    const fetchBagItems = async () => {
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
    
    fetchBagItems();
  }, [id, API_URL, isSearchPage]);

  // ============ ЗАГРУЗАЕМ РЕЙТИНГ СЮРПРИЗА ============
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
      const storedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('authToken');
      
      if (storedUser && token) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }
      
      try {
        const token = sessionStorage.getItem('authToken');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          headers
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          sessionStorage.setItem('user', JSON.stringify(data.user));
          if (data.token) sessionStorage.setItem('authToken', data.token);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
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

  // ============ ФУНКЦИЯ ДЛЯ ОЦЕНКИ СЮРПРИЗА ============
  const rateSurpriseBag = async (rating: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы не открывать состав
    
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

  // ============ ФУНКЦИЯ ДЛЯ ОТОБРАЖЕНИЯ ЗВЕЗД СЮРПРИЗА ============
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
            className={`text-sm transition-all ${userRating !== null ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} ${i <= currentRating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        );
      } else {
        stars.push(
          <span key={i} className={`text-sm ${i <= currentRating ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        );
      }
    }
    
    return stars;
  };

  // Toggle избранного
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
        credentials: 'include',
        body: JSON.stringify({ bag_id: id, quantity: 1 })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === id);
        
        const cartItem = {
          id: id,
          name: propName,
          businessName,
          price: propPrice,
          originalPrice: propOriginalPrice,
          discount: propDiscount,
          imageUrl: propImageUrl,
          quantity: 1,
          description: propDescription,
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
        showNotification(`✅ ${propName} добавлен в корзину!`, 'success');
        
        window.dispatchEvent(new Event('cartUpdated'));
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

  if (!authChecked || (isSearchPage && loading)) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalItems = bagItems.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      {/* Изображение - клик для раскрытия состава (только на странице поиска) */}
      <div 
        className="relative h-52 cursor-pointer" 
        onClick={() => isSearchPage && setShowDetails(!showDetails)}
      >
        <Image 
          src={propImageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'} 
          alt={propName} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Кнопка избранного (сердечко) */}
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition z-10"
        >
          <svg className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-500'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        {/* Бейджи скидки и количества предметов */}
        <div className="absolute top-3 left-3 flex gap-2">
          {propDiscount > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{propDiscount}%
            </div>
          )}
          <div className="bg-[#367666] text-white px-3 py-1 rounded-full text-sm font-bold">
            {totalItems} предметов
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Название ресторана - жирное и темное */}
        <Link href={`/supplier/${id}`}>
          <p className="font-bold text-gray-800 text-base hover:text-[#367666] transition mb-1">
            {businessName}
          </p>
        </Link>
        
        {/* ============ ЗВЕЗДЫ РЕЙТИНГА СЮРПРИЗА И ОЦЕНКА ============ */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {renderBagStars(false)}
            </div>
            {bagTotalReviews > 0 && (
              <span className="text-xs text-gray-500">({bagTotalReviews})</span>
            )}
          </div>
          <p className="text-gray-400 text-xs">{distance}</p>
        </div>
        
        {/* Интерактивные звезды для оценки (только если пользователь не оценил) */}
        {userRating === null && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-gray-400">Оценить сюрприз:</span>
            <div className="flex items-center gap-0.5">
              {renderBagStars(true)}
            </div>
          </div>
        )}
        
        {userRating !== null && (
          <div className="mb-2">
            <span className="text-xs text-green-600">✓ Вы оценили этот сюрприз на {userRating} ★</span>
          </div>
        )}
        
        {/* Название сюрприза */}
        <Link href={`/offers/${id}`}>
          <h3 className="font-semibold text-md mb-1 hover:text-[#367666] transition line-clamp-1">
            {propName}
          </h3>
        </Link>
        
        {/* Описание */}
        <p className="text-gray-500 text-xs mb-3 line-clamp-2">{propDescription}</p>
        
        {/* Состав сюрприза (раскрывается при нажатии на картинку, только на странице поиска) */}
        {isSearchPage && showDetails && bagItems.length > 0 && (
          <div className="mt-3 mb-4 p-3 bg-gray-50 rounded-xl animate-fadeIn">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {bagItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} шт. × {item.price} ₸ = {(item.price * item.quantity).toLocaleString()} ₸
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-[#367666] font-medium">
                При отдельном заказе: {propOriginalPrice.toLocaleString()} ₸
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Экономия: {propDiscount}% ({(propOriginalPrice - propPrice).toLocaleString()} ₸
              </p>
            </div>
          </div>
        )}
        
        {/* Цена и кнопка заказа */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-[#367666]">{propPrice.toLocaleString()} ₸</span>
            {propOriginalPrice > propPrice && (
              <span className="text-gray-400 line-through text-sm ml-2">{propOriginalPrice.toLocaleString()} ₸</span>
            )}
            <p className="text-xs text-gray-400 mt-1">за весь набор</p>
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-5 py-2 rounded-full hover:bg-[#2a5a4d] disabled:opacity-50 transition"
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