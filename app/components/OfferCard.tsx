// app/components/OfferCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  name,
  businessName,
  distance,
  price,
  originalPrice,
  discount,
  imageUrl,
  description,
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('authToken');
      
      if (storedUser && token) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }
      
      const checkViaApi = async () => {
        try {
          const token = localStorage.getItem('authToken');
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
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.token) localStorage.setItem('authToken', data.token);
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
      
      checkViaApi();
    };
    
    checkAuth();
  }, [API_URL]);

  const getCategoryImage = () => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('бургер')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
    if (lowerName.includes('пицца')) return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop';
    if (lowerName.includes('суши')) return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop';
    return imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  };

  // ✅ ДОБАВЛЕНИЕ В КОРЗИНУ С БРОНИРОВАНИЕМ
  const addToCart = async () => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    setAddingToCart(true);
    
    try {
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bag_id: id, quantity: 1 })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ✅ Сохраняем информацию о бронировании
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === id);
        
        if (existing) {
          existing.quantity += 1;
          existing.reservation_id = data.reservation_id;
          existing.expires_at = data.expires_at;
        } else {
          cart.push({
            id, name, businessName, price, originalPrice, discount,
            imageUrl: getCategoryImage(),
            quantity: 1,
            description,
            reservation_id: data.reservation_id,
            expires_at: data.expires_at
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // ✅ Показываем сообщение с таймером
        alert(`✅ ${name} забронирован на 15 минут! Перейдите в корзину для оплаты.`);
        
        window.dispatchEvent(new Event('cartUpdated'));
        if (onOrderSuccess) onOrderSuccess();
        
        // Обновляем главную страницу (товар должен исчезнуть)
        window.dispatchEvent(new CustomEvent('refreshOffers'));
        
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

  if (!authChecked) {
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

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
      <Link href={`/offers/${id}`}>
        <div className="relative h-48">
          <Image src={getCategoryImage()} alt={name} fill className="object-cover" />
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discount}%
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/offers/${id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-emerald-600">{name}</h3>
        </Link>
        <p className="text-gray-500 text-sm mb-2">{businessName} • {distance}</p>
        {description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>}
        
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-emerald-600">{price} ₸</span>
            {originalPrice > price && (
              <span className="text-gray-400 line-through text-sm ml-2">{originalPrice} ₸</span>
            )}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
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
    </div>
  );
}