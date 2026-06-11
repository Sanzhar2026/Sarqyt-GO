'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface SurpriseBag {
  id: number;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url: string;
  available_quantity: number;
  supplier_name: string;
  supplier_id: number;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  // Загрузка избранного из localStorage
  useEffect(() => {
    const loadFavorites = () => {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        try {
          const favoritesList = JSON.parse(saved);
          // Загружаем полные данные для каждого избранного сюрприза
          loadFavoriteBags(favoritesList);
        } catch (e) {
          console.error('Error loading favorites:', e);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    loadFavorites();
  }, []);

  // Загрузка данных сюрпризов по ID
  const loadFavoriteBags = async (favoriteIds: number[]) => {
    if (favoriteIds.length === 0) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    
    try {
      const bagPromises = favoriteIds.map(id =>
        fetch(`/api/surprise-bags/${id}`).then(res => res.ok ? res.json() : null)
      );
      
      const bags = await Promise.all(bagPromises);
      const validBags = bags.filter(bag => bag !== null && bag.available_quantity > 0);
      setFavorites(validBags);
    } catch (error) {
      console.error('Error loading favorite bags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Удаление из избранного
  const removeFromFavorites = (bagId: number) => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      const favoritesList = JSON.parse(saved);
      const updated = favoritesList.filter((id: number) => id !== bagId);
      localStorage.setItem('favorites', JSON.stringify(updated));
      setFavorites(prev => prev.filter(bag => bag.id !== bagId));
    }
  };

  // Добавление в корзину
  const addToCart = async (bagId: number, bagName: string) => {
    const token = sessionStorage.getItem('authToken');
    
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }
    
    setAddingToCart(bagId);
    
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bag_id: bagId, quantity: 1 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(`✅ ${bagName} добавлен в корзину!`, 'success');
      } else {
        showNotification(data.detail || 'Ошибка при добавлении', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Ошибка при добавлении в корзину', 'error');
    } finally {
      setAddingToCart(null);
    }
  };
  
  // Уведомления
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-4 right-4 z-50 p-4 rounded-xl text-white text-center animate-slide-up ${
      type === 'success' ? 'bg-[#367666]' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#367666] text-white px-6 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h1 className="text-xl font-bold">Избранное</h1>
          </div>
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Список избранного */}
      <div className="px-4 pt-4 pb-20">
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">Нет избранных сюрпризов</p>
            <p className="text-gray-400 text-sm mt-2">Добавляйте сюрпризы в избранное, нажимая на сердечко</p>
            <Link href="/offers">
              <button className="mt-6 bg-[#367666] text-white px-6 py-2 rounded-xl hover:bg-[#2a5a4d] transition">
                Перейти к сюрпризам
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((bag) => (
              <div key={bag.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex gap-4">
                  {/* Изображение */}
                  {bag.image_url && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={bag.image_url}
                        alt={bag.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Информация */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/supplier/${bag.supplier_id}`}>
                          <p className="text-xs text-gray-500 hover:text-[#367666]">{bag.supplier_name}</p>
                        </Link>
                        <Link href={`/offers/${bag.id}`}>
                          <h3 className="font-bold text-gray-800 text-base hover:text-[#367666] transition">
                            {bag.name}
                          </h3>
                        </Link>
                      </div>
                      <button
                        onClick={() => removeFromFavorites(bag.id)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <svg className="w-5 h-5 text-red-500 fill-current" fill="currentColor" stroke="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{bag.description}</p>
                    
                    {/* Цена */}
                    <div className="mt-2">
                      <span className="text-gray-400 line-through text-sm">{bag.original_price} ₸</span>
                      <span className="text-[#367666] font-bold text-lg ml-2">{bag.discounted_price} ₸</span>
                      <span className="text-xs text-gray-400 ml-1">-{bag.discount_percentage}%</span>
                    </div>
                    
                    {/* Доступность */}
                    <div className="mt-1">
                      <span className="text-xs text-gray-400">
                        Доступно: {bag.available_quantity} шт.
                      </span>
                    </div>
                    
                    {/* Кнопка заказа */}
                    <button
                      onClick={() => addToCart(bag.id, bag.name)}
                      disabled={bag.available_quantity <= 0 || addingToCart === bag.id}
                      className={`mt-3 w-full py-2 rounded-xl text-sm font-semibold transition ${
                        bag.available_quantity > 0
                          ? 'bg-[#367666] text-white hover:bg-[#2a5a4d]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {addingToCart === bag.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Заказ...
                        </span>
                      ) : bag.available_quantity > 0 ? (
                        'Заказать'
                      ) : (
                        'Нет в наличии'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}