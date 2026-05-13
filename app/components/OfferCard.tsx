// components/OfferCard.tsx
'use client';

import { useRouter } from 'next/navigation';

type Props = {
  id: number;
  name: string;
  businessName: string;
  distance: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl?: string;
};

export default function OfferCard({
  id,
  name,
  businessName,
  distance,
  price,
  originalPrice,
  discount,
}: Props) {
  const router = useRouter();

  const handleBuy = async () => {
    if (!navigator.geolocation) {
      alert('Разрешите доступ к геолокации');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const response = await fetch('http://localhost:8000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              bag_id: id,
              lat: lat,
              lon: lon,
              address: `${lat}, ${lon}`
            }),
          });

          if (response.ok) {
            const order = await response.json();
            router.push(`/offers/${order.order_id}`);
          } else {
            alert('Ошибка при создании заказа');
          }
        } catch (error) {
          console.error(error);
          alert('Ошибка при создании заказа');
        }
      },
      () => alert('Не удалось определить местоположение')
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-gray-500 text-sm">{businessName}</p>
      <p className="text-gray-400 text-xs">📍 {distance}</p>
      
      <div className="flex justify-between items-center mt-3">
        <div>
          <span className="text-emerald-600 font-bold text-xl">{price} ₸</span>
          {originalPrice > price && (
            <span className="text-gray-400 line-through text-sm ml-2">{originalPrice} ₸</span>
          )}
          {discount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
              -{discount}%
            </span>
          )}
        </div>
        <button
          onClick={handleBuy}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Купить 🛒
        </button>
      </div>
    </div>
  );
}