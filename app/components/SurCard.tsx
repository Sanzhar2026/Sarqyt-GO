// app/components/SurpriseBagCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';

// Функция для получения фото по названию
const getImageByTitle = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('пицц') || lowerTitle.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('бургер') || lowerTitle.includes('burger')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('суши') || lowerTitle.includes('sushi') || lowerTitle.includes('ролл')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('салат') || lowerTitle.includes('salad')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('десерт') || lowerTitle.includes('dessert') || lowerTitle.includes('торт')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('крилс') || lowerTitle.includes('wings')) {
    return 'https://images.unsplash.com/photo-1604908177453-130b5f9a4f36?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('картошк') || lowerTitle.includes('fries')) {
    return 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('напит') || lowerTitle.includes('drink') || lowerTitle.includes('кола')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc30dd?w=600&h=400&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop';
};

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
  const [showExpanded, setShowExpanded] = useState(false);
  
  const [bagRating, setBagRating] = useState(rating);
  const [bagTotalReviews, setBagTotalReviews] = useState(totalReviews);

  const API_URL = 'https://toogood-2ncf.onrender.com';

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
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };
    fetchRating();
  }, [id, API_URL]);

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bag_id: id, quantity: 1 })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === id);
        const cartItem = {
          id, name, businessName: supplierName,
          price, originalPrice, discount, imageUrl: getImageByTitle(name),
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
        showNotification(`✅ ${name} добавлен в корзину!`, 'success');
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
    toast.className = `fixed bottom-20 left-4 right-4 z-50 p-2 rounded-xl text-white text-center animate-slide-up text-sm ${
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

  // Отображение звезд
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(bagRating);
    const hasHalfStar = bagRating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) stars.push(<span key={`full-${i}`} className="text-yellow-400 text-[10px]">★</span>);
    if (hasHalfStar) stars.push(<span key="half" className="text-yellow-400 text-[10px]">½</span>);
    for (let i = stars.length; i < 5; i++) stars.push(<span key={`empty-${i}`} className="text-gray-300 text-[10px]">★</span>);
    return stars;
  };

  if (!authChecked) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-32 bg-gray-200"></div>
        <div className="p-2">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const shortAddress = address && address.length > 30 ? address.substring(0, 30) + '...' : address;
  const fullAddress = address || 'Адрес не указан';

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Изображение - по названию */}
      <div className="relative h-32">
        <Image 
          src={imageUrl || getImageByTitle(name)} 
          alt={name} 
          fill 
          className="object-cover"
        />
        
        {/* Иконка сюрприза и количество (слева вверху) */}
        <div className="absolute top-2 left-2 bg-black/50 rounded-full px-2 py-1 flex items-center gap-1" style={{ borderRadius: '9999px' }}>
          <Gift size={14} className="text-gray-300/70" />
          <span className="text-white text-[10px] font-bold">{availableQuantity}</span>
        </div>
      </div>
      
      <div className="p-2">
        <Link href={`/supplier/${id}`}>
          <p className="font-bold text-[#367666] text-xs hover:text-[#2a5a4d] transition mb-0.5">
            {supplierName}
          </p>
        </Link>
        
        <h3 className="font-semibold text-gray-800 text-sm mb-0.5 line-clamp-1">
          {name}
        </h3>
        
        <div className="text-gray-500 text-[10px] mb-0.5 leading-tight line-clamp-1">
          {shortAddress} • {pickupStartTime && pickupEndTime ? `${pickupStartTime}-${pickupEndTime}` : 'Время не указано'}
        </div>
        
        {/* Расширенный адрес при клике */}
        {showExpanded && fullAddress !== shortAddress && (
          <div className="text-gray-400 text-[10px] mb-0.5 leading-tight">
            📍 {fullAddress}
          </div>
        )}
        
        {/* Рейтинг */}
        <div className="flex items-center justify-between mt-0.5 mb-0.5">
          <div className="flex items-center gap-0.5">
            {renderStars()}
            {bagTotalReviews > 0 && <span className="text-[8px] text-gray-400">({bagTotalReviews})</span>}
          </div>
          
          {/* Кнопка раскрытия адреса (вместо восклицательного знака) */}
          <button 
            onClick={() => setShowExpanded(!showExpanded)}
            className="text-[9px] text-gray-400 hover:text-[#367666] transition"
          >
            {showExpanded ? 'Свернуть' : 'Подробнее'}
          </button>
        </div>
        
        {/* Цена и кнопка */}
        <div className="flex items-center justify-between mt-1 pt-0.5 border-t border-gray-100">
          <div>
            <span className="text-xs font-bold text-[#367666]">{formatPrice(price)}</span>
            {originalPrice > price && <span className="text-gray-400 line-through text-[7px] ml-0.5">{formatPrice(originalPrice)}</span>}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-3 py-0.5 rounded-lg text-[9px] font-semibold hover:bg-[#2a5a4d] disabled:opacity-50 transition"
          >
            {addingToCart ? (
              <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Заказать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}