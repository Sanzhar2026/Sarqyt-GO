// app/components/OfferCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SurpriseItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

interface SurpriseBagData {
  id: number;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url: string;
  available_quantity: number;
  is_active: boolean;
  supplier_name: string;
  supplier_id: number;
  items: SurpriseItem[];
  totalItems?: number;
}

interface OfferCardProps {
 id: number;
  name: string;           // ← ДОБАВИТЬ
  businessName: string;
  distance: string;
  price: number;          // ← ДОБАВИТЬ
  originalPrice: number;  // ← ДОБАВИТЬ
  discount: number;       // ← ДОБАВИТЬ
  imageUrl: string;       // ← ДОБАВИТЬ
  description?: string;   // ← ДОБАВИТЬ
  onOrderSuccess?: () => void;
}

export default function OfferCard({
  id,
  businessName,
  distance,
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [bag, setBag] = useState<SurpriseBagData | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // ✅ ЗАГРУЗКА ДАННЫХ СЮРПРИЗА ИЗ БД
  useEffect(() => {
    const fetchBag = async () => {
      try {
        const response = await fetch(`${API_URL}/api/surprise-bags/${id}`);
        if (response.ok) {
          const data = await response.json();
          setBag(data);
        }
      } catch (error) {
        console.error('Error fetching bag:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBag();
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

  const addToCart = async () => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    if (!bag || bag.available_quantity <= 0) {
      alert('Товар временно недоступен');
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
          id: bag.id,
          name: bag.name,
          businessName,
          price: bag.discounted_price,
          originalPrice: bag.original_price,
          discount: bag.discount_percentage,
          imageUrl: bag.image_url,
          quantity: 1,
          description: bag.description,
          totalItems: bag.items?.length || 1,
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
        alert(`✅ ${bag.name} забронирован на 15 минут!`);
        
        window.dispatchEvent(new Event('cartUpdated'));
        if (onOrderSuccess) onOrderSuccess();
        
      } else {
        alert(data.detail || '❌ Товар временно недоступен');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Ошибка соединения');
    } finally {
      setAddingToCart(false);
    }
  };

  if (!authChecked || loading) {
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

  if (!bag) {
    return null;
  }

  const totalItems = bag.items?.reduce((sum, item) => sum + item.quantity, 0) || 1;
  const discount = bag.discount_percentage || 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      {/* Изображение с бейджами */}
      <div className="relative h-52 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <Image 
          src={bag.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'} 
          alt={bag.name} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {discount > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discount}%
            </div>
          )}
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            🎁 {totalItems} предметов
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        {/* Название и ресторан */}
        <Link href={`/offers/${id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-emerald-600 transition line-clamp-1">
            {bag.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 text-sm">{businessName}</p>
          <p className="text-gray-400 text-xs">📍 {distance}</p>
        </div>
        
        {/* Краткое описание */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{bag.description}</p>
        
        {/* Детальный состав сюрприза */}
        {showDetails && bag.items && bag.items.length > 0 && (
          <div className="mt-3 mb-4 p-3 bg-gray-50 rounded-xl animate-fadeIn">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <span>🎁</span> В состав сюрприза входит:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bag.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} шт. × {item.price} ₸ = {(item.price * item.quantity).toLocaleString()} ₸
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-emerald-600 font-medium">
                ✨ При отдельном заказе: {bag.original_price.toLocaleString()} ₸
              </p>
              <p className="text-xs text-gray-500 mt-1">
                💰 Экономия: {discount}% ({Math.round(bag.original_price - bag.discounted_price).toLocaleString()} ₸)
              </p>
            </div>
          </div>
        )}
        
        {/* Цена и кнопка */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-emerald-600">{bag.discounted_price.toLocaleString()} ₸</span>
            {bag.original_price > bag.discounted_price && (
              <span className="text-gray-400 line-through text-sm ml-2">{bag.original_price.toLocaleString()} ₸</span>
            )}
            <p className="text-xs text-gray-400 mt-1">за весь набор</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm"
            >
              {showDetails ? 'Скрыть' : 'Состав'}
            </button>
            
            <button
              onClick={addToCart}
              disabled={addingToCart || bag.available_quantity <= 0}
              className={`px-5 py-2 rounded-full transition flex items-center gap-2 ${
                addingToCart || bag.available_quantity <= 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Бронирование...</span>
                </>
              ) : (
                <>
                  <span>🛒</span>
                  <span>В корзину</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Индикатор количества */}
        {bag.available_quantity <= 3 && bag.available_quantity > 0 && (
          <p className="text-xs text-orange-500 mt-2">
            ⚡ Осталось всего {bag.available_quantity} шт.
          </p>
        )}
        {bag.available_quantity === 0 && (
          <p className="text-xs text-red-500 mt-2">
            ❌ Распродано
          </p>
        )}
      </div>
    </div>
  );
}