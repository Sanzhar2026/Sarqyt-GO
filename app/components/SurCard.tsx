'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gift, Info, Heart } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

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
  const [isFavorite, setIsFavorite] = useState(false);

  const [bagRating, setBagRating] = useState(rating);
  const [bagTotalReviews, setBagTotalReviews] = useState(totalReviews);
  const API_URL = 'https://toogood-production.up.railway.app';

  // ✅ ТОЛЬКО АДРЕС — БЕЗ СОСТАВА!
  const handleIconClick = () => {
    setShowExpanded(!showExpanded);
  };

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const token = getAuthToken();
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
  }, [id]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/auth/me`);
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        if (data.token) sessionStorage.setItem('userToken', data.token);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const favorites = localStorage.getItem('favorites');
    if (favorites) {
      const favList = JSON.parse(favorites);
      setIsFavorite(favList.includes(id));
    }
  }, [id]);

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
    const token = getAuthToken();
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }
    
    if (availableQuantity <= 0) {
      alert('Этот сюрприз закончился');
      return;
    }
    
    setAddingToCart(true);
    
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
      console.log('📡 Ответ /api/cart/add:', response.status, data);

      if (response.status === 401) {
        alert('Сессия истекла. Пожалуйста, войдите заново.');
        router.push('/login');
        return;
      }

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

  const shortAddress = address && address.length > 35 ? address.substring(0, 35) + '...' : address;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="relative h-40">
        <Image 
          src={imageUrl || getImageByTitle(name)} 
          alt={name} 
          fill 
          className="object-cover"
        />
        
        <div className="absolute top-2 left-2 flex gap-1.5">
          {discount > 0 && (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-[11px] font-bold shadow-sm">
              -{discount}%
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center w-8 h-8">
            <Gift size={20} className="text-gray-800" />
          </div>
        </div>
        
        <button 
          onClick={toggleFavorite}
          className="absolute top-2 right-2 z-10"
        >
          <Heart 
            size={20} 
            className={`transition ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400/70 hover:text-red-400'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
        
        {/* ✅ КНОПКА ❗ — ПОКАЗЫВАЕТ АДРЕС */}
        <button 
          onClick={handleIconClick}
          className="absolute bottom-2 right-2 z-10 bg-black/40 backdrop-blur rounded-full p-1.5 hover:bg-black/60 transition"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-3">
        <Link href={`/supplier/${id}`}>
          <p className="font-bold text-[#367666] text-sm hover:text-[#2a5a4d] transition mb-1">
            {supplierName}
          </p>
        </Link>
        
        <h3 className="font-semibold text-gray-800 text-base mb-1 line-clamp-1">
          {name}
        </h3>
        
        {/* ✅ ПРИ НАЖАТИИ ПОКАЗЫВАЕТ АДРЕС */}
        <div className="text-gray-500 text-xs mb-1 leading-tight">
          {showExpanded ? address : shortAddress} • {pickupStartTime && pickupEndTime ? `${pickupStartTime}-${pickupEndTime}` : 'Время не указано'}
        </div>
        
        <div className="flex items-center gap-1 mt-1 mb-2">
          {renderStars()}
          {bagTotalReviews > 0 && <span className="text-[10px] text-gray-400">({bagTotalReviews} {getReviewText(bagTotalReviews)})</span>}
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-[#367666]">{formatPrice(price)}</span>
            {originalPrice > price && <span className="text-gray-400 line-through text-xs ml-1">{formatPrice(originalPrice)}</span>}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-10 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#2a5a4d] disabled:opacity-50 transition whitespace-nowrap"
          >
            {addingToCart ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Заказать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}