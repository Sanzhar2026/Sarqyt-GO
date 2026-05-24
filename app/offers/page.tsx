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
  const [selectedBag, setSelectedBag] = useState<SurpriseBag | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [bookedBags, setBookedBags] = useState<Set<number>>(new Set());

  const fetchBags = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/surprise-bags', {
        credentials: 'include'
      });
      const data = await response.json();
      setBags(data);
      
      const booked = new Set<number>();
      for (const bag of data) {
        try {
          const checkRes = await fetch(`https://toogood-2ncf.onrender.com/api/bookings/check/${bag.id}`, {
            credentials: 'include'
          });
          const checkData = await checkRes.json();
          if (checkData.is_booked) {
            booked.add(bag.id);
          }
        } catch (e) {}
      }
      setBookedBags(booked);
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

  const handleSelectBag = (bag: SurpriseBag) => {
    setSelectedBag(bag);
    setShowModal(true);
  };

  // app/offers/page.tsx - исправленная функция

const confirmBooking = async () => {
  if (!selectedBag) return;
  
  try {
    const response = await fetch('https://toogood-2ncf.onrender.com/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bag_id: selectedBag.id })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // ✅ Добавляем в корзину (localStorage)
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item: any) => item.id === selectedBag.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: selectedBag.id,
          name: selectedBag.name,
          businessName: selectedBag.supplier_name,
          price: selectedBag.discounted_price,
          originalPrice: selectedBag.original_price,
          discount: selectedBag.discount_percentage,
          imageUrl: selectedBag.image_url,
          quantity: 1
        });
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Обновляем счетчик в navbar
      window.dispatchEvent(new Event('cartUpdated'));
      
      alert(`✅ ${selectedBag.name} добавлен в корзину! У вас 15 минут на оплату.`);
      
      // Обновляем список бронирований
      await fetchBags();
      setShowModal(false);
      
      // ✅ Перенаправляем в корзину
      router.push('/cart');
    } else {
      alert(`❌ ${data.message}`);
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert('Ошибка бронирования');
  }
};

  const addToCart = async (bagId: number) => {
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bag_id: bagId, quantity: 1 })
      });
      
      const data = await response.json();
      if (data.success) {
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
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
          
          {/* Кнопки языка */}
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
                    src={bag.image_url || '/placeholder.jpg'}
                    alt={bag.name}
                    fill
                    className="object-cover"
                  />
                  {bag.discount_percentage > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      -{bag.discount_percentage}%
                    </div>
                  )}
                  {bookedBags.has(bag.id) && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      ⏱️ {lang === 'kz' ? 'Броньдалған' : 'Забронирован'}
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-lg">{bag.name}</h3>
                  <p className="text-gray-500 text-sm">{bag.supplier_name}</p>
                  <p className="text-gray-600 text-sm mt-2">{bag.description}</p>
                  
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
                      onClick={() => handleSelectBag(bag)}
                      disabled={bookedBags.has(bag.id)}
                      className={`px-6 py-2 rounded-xl font-semibold transition ${
                        bookedBags.has(bag.id)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {bookedBags.has(bag.id) 
                        ? (lang === 'kz' ? 'Броньдалған' : 'Забронирован')
                        : (lang === 'kz' ? 'Таңдау' : 'Выбрать')
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && selectedBag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">⏱️</div>
              <h2 className="text-2xl font-bold text-gray-800">
                {lang === 'kz' ? 'Растау' : 'Подтверждение'}
              </h2>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-gray-800">{selectedBag.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{selectedBag.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-500">{lang === 'kz' ? 'Құны' : 'Стоимость'}:</span>
                <span className="text-xl font-bold text-emerald-600">
                  {formatPrice(selectedBag.discounted_price)}
                </span>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-200">
              <p className="text-sm text-yellow-700">
                ⏰ {lang === 'kz' 
                  ? 'Растағаннан кейін төлемге <strong>15 минут</strong> уақытыңыз болады!'
                  : 'После подтверждения у вас будет <strong>15 минут</strong> на оплату!'}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
              >
                {lang === 'kz' ? 'Бас тарту' : 'Отмена'}
              </button>
              <button
                onClick={confirmBooking}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg"
              >
                {lang === 'kz' ? 'Броньдау' : 'Забронировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}