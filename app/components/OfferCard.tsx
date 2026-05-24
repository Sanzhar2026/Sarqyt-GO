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
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // ✅ Проверяем авторизацию через API (более надежно)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/check-auth`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        setIsAuth(data.authenticated === true);
        
        // Если авторизован, сохраняем в localStorage
        if (data.authenticated && data.user_id) {
          localStorage.setItem('user', JSON.stringify({
            id: data.user_id,
            name: data.user_name || 'User',
            phone: data.user_phone || ''
          }));
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Fallback на localStorage
        const user = localStorage.getItem('user');
        setIsAuth(!!user);
      } finally {
        setAuthChecking(false);
      }
    };
    
    checkAuth();
  }, [API_URL]);

  // Добавление в корзину
  const addToCart = async () => {
    // ✅ Сначала проверяем авторизацию через API
    let authenticated = isAuth;
    
    if (!authenticated) {
      try {
        const response = await fetch(`${API_URL}/api/check-auth`, {
          credentials: 'include'
        });
        const data = await response.json();
        authenticated = data.authenticated === true;
        setIsAuth(authenticated);
      } catch (error) {
        console.error('Auth check error:', error);
      }
    }
    
    if (!authenticated) {
      setShowAuthModal(true);
      return;
    }

    setAddingToCart(true);
    
    try {
      console.log(`🛒 Добавление в корзину: bag_id=${id}`);
      
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bag_id: id,
          quantity: 1
        })
      });

      const data = await response.json();
      console.log('📦 Ответ сервера:', data);

      if (response.ok) {
        // Добавляем в localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find((item: any) => item.id === id);
        
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            id: id,
            name: name,
            businessName: businessName,
            price: price,
            originalPrice: originalPrice,
            discount: discount,
            imageUrl: imageUrl,
            quantity: 1
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        showNotification('✅ Товар добавлен в корзину!', 'success');
        
        window.dispatchEvent(new Event('cartUpdated'));
        
        if (onOrderSuccess) {
          onOrderSuccess();
        }
        window.dispatchEvent(new CustomEvent('refreshOffers'));
        
        setTimeout(() => {
          router.push('/offers');
        }, 1000);
        
      } else {
        if (response.status === 401) {
          setShowAuthModal(true);
          showNotification('Пожалуйста, войдите в аккаунт', 'error');
        } else {
          showNotification(data.detail || 'Ошибка при добавлении', 'error');
        }
      }
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Ошибка при добавлении в корзину', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-24 left-4 right-4 z-50 ${
      type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    } text-white rounded-2xl p-4 shadow-xl animate-slide-up`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  if (authChecking) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <Link href={`/offers/${id}`}>
          <div className="relative h-48">
            <Image
              src={imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop'}
              alt={name}
              fill
              className="object-cover"
            />
            {discount > 0 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                -{discount}%
              </div>
            )}
          </div>
        </Link>
        
        <div className="p-4">
          <Link href={`/offers/${id}`}>
            <h3 className="font-bold text-lg mb-1 hover:text-emerald-600 transition">{name}</h3>
          </Link>
          <p className="text-gray-500 text-sm mb-2">{businessName} • {distance}</p>
          
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-2xl font-bold text-emerald-600">{price} ₸</span>
              {originalPrice > price && (
                <span className="text-gray-400 line-through text-sm ml-2">{originalPrice} ₸</span>
              )}
            </div>
            
            <button
              onClick={addToCart}
              disabled={addingToCart}
              className="bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Добавление...</span>
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

      {/* Модальное окно для неавторизованных */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🔒</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Требуется авторизация</h2>
              <p className="text-gray-500">Войдите или зарегистрируйтесь, чтобы добавить товар в корзину</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.setItem('redirectAfterLogin', window.location.pathname);
                  router.push('/login');
                }}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition"
              >
                Войти
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
              >
                Зарегистрироваться
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                className="w-full text-gray-500 py-2 text-sm"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}