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
  category?: string;
  items?: string[];
  onOrderSuccess?: () => void;
}

export default function OfferCard({ id, name, businessName, distance, price, originalPrice, discount, imageUrl, description, category, items, onOrderSuccess }: OfferCardProps) {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // ✅ Улучшенная проверка авторизации
  const checkAuth = async () => {
    try {
      // 1. Проверяем localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return true;
      }

      // 2. Проверяем через сервер (cookies)
      const response = await fetch(`${API_URL}/api/check-auth`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          name: data.user_name || data.full_name,
          phone: data.user_phone
        }));
        return true;
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Fallback
      const storedUser = localStorage.getItem('user');
      const isAuth = !!storedUser;
      setIsAuthenticated(isAuth);
      return isAuth;
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkAuth();

    // Слушаем события обновления авторизации
    const handleAuthUpdate = () => checkAuth();
    window.addEventListener('authUpdated', handleAuthUpdate);
    
    return () => window.removeEventListener('authUpdated', handleAuthUpdate);
  }, []);

  const addToCart = async () => {
    const isAuth = await checkAuth(); // ← Повторная проверка перед добавлением

    if (!isAuth) {
      setShowAuthModal(true);
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

      if (response.ok) {
        showNotification('✅ Товар добавлен в корзину!', 'success');
        window.dispatchEvent(new Event('cartUpdated'));
        if (onOrderSuccess) onOrderSuccess();
      } else if (response.status === 401) {
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setShowAuthModal(true);
      } else {
        showNotification(data.detail || 'Ошибка добавления', 'error');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      showNotification('Ошибка соединения', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-20 left-4 right-4 z-50 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white rounded-2xl p-4 shadow-xl`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  };

  if (!authChecked) {
    return <div className="bg-white rounded-2xl h-80 animate-pulse" />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all">
        {/* ... остальной JSX карточки без изменений ... */}
        <Link href={`/offers/${id}`}>
          <div className="relative h-48">
            <Image src={imageUrl || '...'} alt={name} fill className="object-cover" />
            {discount > 0 && <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">-{discount}%</div>}
          </div>
        </Link>

        <div className="p-4">
          <Link href={`/offers/${id}`}>
            <h3 className="font-bold text-lg mb-1">{name}</h3>
          </Link>
          <p className="text-gray-500 text-sm mb-3">{businessName} • {distance}</p>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-emerald-600">{price} ₸</span>
              {originalPrice > price && <span className="line-through text-gray-400 ml-2">{originalPrice} ₸</span>}
            </div>

            <button
              onClick={addToCart}
              disabled={addingToCart}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full flex items-center gap-2 transition disabled:opacity-70"
            >
              {addingToCart ? 'Добавляем...' : '🛒 В корзину'}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-center mb-4">Нужно войти в аккаунт</h2>
            <p className="text-gray-600 text-center mb-6">Чтобы добавлять товары в корзину, пожалуйста, авторизуйтесь</p>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-semibold mb-3"
            >
              Войти
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-2xl font-semibold"
            >
              Зарегистрироваться
            </button>
            <button onClick={() => setShowAuthModal(false)} className="w-full mt-4 text-gray-500">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}