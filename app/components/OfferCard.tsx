// app/components/OfferCard.tsx
'use client';

import { useState } from 'react';
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
}: OfferCardProps) {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Проверяем авторизацию
  const isAuthenticated = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return !!user;
    }
    return false;
  };

  // ТОЛЬКО ДОБАВЛЕНИЕ В КОРЗИНУ (без создания заказа!)
  const addToCart = () => {
    if (!isAuthenticated()) {
      setShowAuthModal(true);
      return;
    }

    setAddingToCart(true);
    
    try {
      // Получаем текущую корзину
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Проверяем, есть ли уже такой товар
      const existingItem = cart.find((item: any) => item.id === id);
      
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        cart.push({
          id,
          name,
          businessName,
          price,
          originalPrice,
          discount,
          imageUrl,
          quantity: 1
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Показываем уведомление
      showNotification('Товар добавлен в корзину! 🛒');
      
      // Обновляем счетчик в navbar
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Опционально: перенаправляем в корзину через секунду
      setTimeout(() => {
        router.push('/cart');
      }, 1000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Ошибка при добавлении в корзину', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-24 left-4 right-4 z-50 bg-${type === 'success' ? 'emerald-600' : 'red-600'} text-white rounded-2xl p-4 shadow-xl animate-slide-up`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

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
                onClick={() => router.push('/login')}
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