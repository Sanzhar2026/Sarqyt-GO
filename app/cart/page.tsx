'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { translations, type Language } from '@/lib/i18n';

interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  supplier: string;
  quantity: number;
  imageUrl?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('kz');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    const newCart = cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    saveCart(newCart);
  };

  const removeItem = (id: number) => {
    const newCart = cart.filter(item => item.id !== id);
    saveCart(newCart);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    setLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        for (const item of cart) {
          try {
            await fetch('http://localhost:8000/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                bag_id: item.id,
                lat: latitude,
                lon: longitude,
                address: 'Delivery address'
              }),
            });
          } catch (error) {
            console.error('Order failed:', error);
          }
        }
        
        localStorage.removeItem('cart');
        setCart([]);
        alert(lang === 'kz' ? 'Тапсырыс қабылданды!' : 'Заказ принят!');
        router.push('/my-orders');
      });
    } else {
      alert(t.locationRequired);
    }
    setLoading(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-emerald-600 text-white px-6 pt-12 pb-8">
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold">{t.cart}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setLang('kz')}
                className={`px-3 py-1 rounded-full text-sm ${lang === 'kz' ? 'bg-white text-emerald-600' : 'bg-white/20'}`}
              >
                Қаз
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-3 py-1 rounded-full text-sm ${lang === 'ru' ? 'bg-white text-emerald-600' : 'bg-white/20'}`}
              >
                Рус
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500">{t.cartEmpty}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 bg-emerald-600 text-white px-6 py-3 rounded-2xl"
          >
            {t.discover}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-6">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">{t.cart}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1 rounded-full text-sm ${lang === 'kz' ? 'bg-white text-emerald-600' : 'bg-white/20'}`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded-full text-sm ${lang === 'ru' ? 'bg-white text-emerald-600' : 'bg-white/20'}`}
            >
              Рус
            </button>
          </div>
        </div>
        <p className="text-emerald-100 text-sm mt-2">
          {cart.length} {lang === 'kz' ? 'тағам' : 'блюда'}
        </p>
      </div>

      {/* Cart Items */}
      <div className="p-6 space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl">
                🍽️
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-gray-500 text-sm">{item.supplier}</p>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <span className="text-emerald-600 font-bold text-lg">
                      {item.price} ₸
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-gray-400 line-through text-sm ml-2">
                        {item.originalPrice} ₸
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-5 mt-4 shadow-sm">
          <h3 className="font-bold text-lg mb-4">{t.total}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>{lang === 'kz' ? 'Тағамдар' : 'Блюда'}</span>
              <span>{subtotal} ₸</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{lang === 'kz' ? 'Жеткізу' : 'Доставка'}</span>
              <span>{deliveryFee} ₸</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>{t.total}</span>
                <span className="text-emerald-600">{total} ₸</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading 
              ? (lang === 'kz' ? 'Өңделуде...' : 'Обработка...')
              : t.checkout}
          </button>
        </div>
      </div>
    </div>
  );
}