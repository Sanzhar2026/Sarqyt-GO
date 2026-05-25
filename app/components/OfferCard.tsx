// app/components/OfferCard.tsx - самая простая версия
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
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  const addToCart = async () => {
    setLoading(true);
    
    try {
      // Берем user_id из localStorage или создаем новый
      let userId = localStorage.getItem('user_id');
      if (!userId) {
        userId = String(Date.now());
        localStorage.setItem('user_id', userId);
        localStorage.setItem('user', JSON.stringify({ id: userId, name: 'User', phone: '+77777777777' }));
      }
      
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bag_id: id, quantity: 1 })
      });

      if (response.ok) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((i: any) => i.id === id);
        if (existing) existing.quantity++;
        else cart.push({ id, name, businessName, price, originalPrice, discount, imageUrl, quantity: 1 });
        
        localStorage.setItem('cart', JSON.stringify(cart));
        alert('✅ Товар в корзине!');
        window.dispatchEvent(new Event('cartUpdated'));
        onOrderSuccess?.();
        router.push('/offers');
      } else {
        alert('Ошибка');
      }
    } catch (err) {
      alert('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md">
      <Link href={`/offers/${id}`}>
        <div className="relative h-48">
          <Image src={imageUrl || '/food.jpg'} alt={name} fill className="object-cover" />
          {discount > 0 && <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm">-{discount}%</div>}
        </div>
      </Link>
      <div className="p-4">
        <h3 className="font-bold text-lg">{name}</h3>
        <p className="text-gray-500 text-sm">{businessName} • {distance}</p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-2xl font-bold text-emerald-600">{price} ₸</span>
          <button onClick={addToCart} disabled={loading} className="bg-emerald-600 text-white px-5 py-2 rounded-full">
            {loading ? '...' : '🛒'}
          </button>
        </div>
      </div>
    </div>
  );
}