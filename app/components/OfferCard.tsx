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
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [bagItems, setBagItems] = useState<SurpriseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Загружаем состав сюрприза
  useEffect(() => {
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
        alert(`✅ ${propName} забронирован на 15 минут!`);
        
        window.dispatchEvent(new Event('cartUpdated'));
        if (onOrderSuccess) onOrderSuccess();
        
      } else {
        alert(data.detail || 'Товар временно недоступен');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ошибка соединения');
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

  const totalItems = bagItems.reduce((sum, item) => sum + item.quantity, 0) || 1;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      {/* Изображение */}
      <div className="relative h-52 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <Image 
          src={propImageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop'} 
          alt={propName} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
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
        {/* Убрана кнопка с фото */}
      </div>
      
      <div className="p-4">
        {/* Название */}
        <Link href={`/offers/${id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-[#367666] transition line-clamp-1">
            {propName}
          </h3>
        </Link>
        
        {/* Ресторан и расстояние */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 text-sm">{businessName}</p>
          <p className="text-gray-400 text-xs">{distance}</p>
        </div>
        
        {/* Описание */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{propDescription}</p>
        
        {/* Состав сюрприза */}
        {showDetails && bagItems.length > 0 && (
          <div className="mt-3 mb-4 p-3 bg-gray-50 rounded-xl animate-fadeIn">
            <h4 className="font-semibold text-sm mb-2">
              В состав входит:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bagItems.map((item, idx) => (
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
              <p className="text-xs text-[#367666] font-medium">
                При отдельном заказе: {propOriginalPrice.toLocaleString()} ₸
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Экономия: {propDiscount}% ({(propOriginalPrice - propPrice).toLocaleString()} ₸)
              </p>
            </div>
          </div>
        )}
        
        {/* Цена и кнопки */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-[#367666]">{propPrice.toLocaleString()} ₸</span>
            {propOriginalPrice > propPrice && (
              <span className="text-gray-400 line-through text-sm ml-2">{propOriginalPrice.toLocaleString()} ₸</span>
            )}
            <p className="text-xs text-gray-400 mt-1">за весь набор</p>
          </div>
          
          <div className="flex gap-2">
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
    </div>
  );
}