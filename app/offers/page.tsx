// app/offers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../layout';

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

export default function OffersPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  const fetchBags = async () => {
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/surprise-bags', {
        credentials: 'include'
      });
      const data = await response.json();
      setBags(data);
    } catch (error) {
      console.error('Error fetching bags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBags();
    const interval = setInterval(fetchBags, 30000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = async (bag: SurpriseBag) => {
    if (bag.available_quantity <= 0) {
      alert(lang === 'kz' ? 'Бұл сюрприз таусылған' : 'Этот сюрприз закончился');
      return;
    }

    setAddingId(bag.id);
    
    try {
      console.log('🛒 Добавление в корзину:', bag.id, bag.name);
      
      const response = await fetch('https://toogood-2ncf.onrender.com/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bag_id: bag.id, quantity: 1 })
      });

      const data = await response.json();
      console.log('📦 Ответ сервера:', data);

      if (response.ok && data.success) {
        // Добавляем в localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === bag.id);
        
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            id: bag.id,
            name: bag.name,
            businessName: bag.supplier_name,
            price: bag.discounted_price,
            originalPrice: bag.original_price,
            discount: bag.discount_percentage,
            imageUrl: bag.image_url,
            quantity: 1
          });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
        
        alert(`✅ ${bag.name} добавлен в корзину!`);
        router.push('/cart');
      } else {
        alert(data.detail || data.message || '❌ Ошибка при добавлении');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Ошибка соединения с сервером');
    } finally {
      setAddingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-KZ') + ' ₸';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header с кнопками языка */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {lang === 'kz' ? '🎁 Сюрприз-пакеттер' : '🎁 Сюрприз-пакеты'}
          </h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'kz' 
                  ? 'bg-white text-emerald-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'ru' 
                  ? 'bg-white text-emerald-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Рус
            </button>
          </div>
        </div>
        <p className="text-emerald-100 text-sm mt-1">
          {lang === 'kz' ? 'Өзіңізге сюрприз-пакетті таңдаңыз' : 'Выберите свой сюрприз-пакет'}
        </p>
      </div>

      {/* Bags Grid */}
      <div className="px-4 py-6">
        {bags.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-500">
              {lang === 'kz' ? 'Барлық пакеттер уақытша броньдалған' : 'Все пакеты временно забронированы'}
            </p>
            <button 
              onClick={fetchBags}
              className="mt-4 text-emerald-600 underline"
            >
              {lang === 'kz' ? 'Жаңарту' : 'Обновить'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bags.map((bag) => (
              <div key={bag.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={bag.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                    alt={bag.name}
                    fill
                    className="object-cover"
                  />
                  {bag.discount_percentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{bag.discount_percentage}%
                    </div>
                  )}
                  {bag.available_quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm px-3 py-1 bg-red-600 rounded-full">
                        {lang === 'kz' ? 'Таусылған' : 'Распродано'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-lg">{bag.name}</h3>
                  <p className="text-gray-500 text-sm">{bag.supplier_name}</p>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{bag.description}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatPrice(bag.discounted_price)}
                      </span>
                      {bag.original_price > bag.discounted_price && (
                        <span className="text-gray-400 line-through text-sm ml-2">
                          {formatPrice(bag.original_price)}
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => addToCart(bag)}
                      disabled={bag.available_quantity <= 0 || addingId === bag.id}
                      className={`px-6 py-2 rounded-xl font-semibold transition ${
                        bag.available_quantity <= 0 || addingId === bag.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {addingId === bag.id ? (
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {lang === 'kz' ? 'Қосылуда...' : 'Добавление...'}
                        </span>
                      ) : (
                        lang === 'kz' ? '🛒 Себетке' : '🛒 В корзину'
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