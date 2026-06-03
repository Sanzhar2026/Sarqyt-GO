// app/supplier/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
  pickup_start_time?: string;
  pickup_end_time?: string;
}

interface Supplier {
  id: number;
  business_name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  city: string;
  cover_image?: string;
}

export default function SupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'https://toogood-2ncf.onrender.com';
  const supplierId = params?.id;

  useEffect(() => {
    const fetchSupplierAndBags = async () => {
      if (!supplierId) return;
      
      try {
        // Загружаем информацию о магазине
        const supplierRes = await fetch(`/api/suppliers/${supplierId}`);
        if (!supplierRes.ok) throw new Error('Supplier not found');
        const supplierData = await supplierRes.json();
        setSupplier(supplierData);
        
        // Загружаем сюрпризы магазина
        const bagsRes = await fetch(`/api/suppliers/${supplierId}/surprise-bags`);
        if (bagsRes.ok) {
          const bagsData = await bagsRes.json();
          setBags(bagsData.filter((bag: SurpriseBag) => bag.available_quantity > 0));
        }
        
      } catch (err) {
        console.error('Error:', err);
        setError('Не удалось загрузить информацию');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSupplierAndBags();
  }, [supplierId]);

  const handleOrderClick = (bagId: number) => {
    router.push(`/offers/${bagId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Магазин не найден</h1>
          <p className="text-gray-500 mb-6">{error || 'Проверьте адрес или вернитесь на главную'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header с информацией о магазине */}
      <div className="relative">
        {supplier.cover_image ? (
          <div className="h-48 w-full overflow-hidden">
            <img 
              src={supplier.cover_image} 
              alt={supplier.business_name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-emerald-600 to-green-600" />
        )}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
        >
          ← Назад
        </button>
      </div>

      {/* Информация о магазине */}
      <div className="bg-white rounded-2xl shadow-sm mx-4 -mt-8 relative z-10 p-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center text-3xl">
            🏪
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{supplier.business_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm text-gray-600">{supplier.rating || 4.5}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">{supplier.city || 'Город не указан'}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{supplier.address}</p>
            {supplier.phone && (
              <p className="text-sm text-gray-500 mt-1">📞 {supplier.phone}</p>
            )}
          </div>
        </div>
        {supplier.description && (
          <p className="text-gray-600 text-sm mt-4 pt-3 border-t border-gray-100">
            {supplier.description}
          </p>
        )}
      </div>

      {/* Список сюрпризов */}
      <div className="px-4 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Сюрпризы</h2>
        
        {bags.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🎁</div>
            <p className="text-gray-500">Нет доступных сюрпризов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bags.map((bag) => (
              <div key={bag.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="flex">
                  {/* Изображение */}
                  {bag.image_url && (
                    <div className="w-32 h-32 flex-shrink-0">
                      <img 
                        src={bag.image_url} 
                        alt={bag.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Информация */}
                  <div className="flex-1 p-4">
                    <h3 className="font-bold text-gray-800 text-lg">{bag.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{bag.description}</p>
                    
                    {/* Что входит в сюрприз */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-400">Что внутри:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🍕 Пицца</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🥤 Напиток</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">🍰 Десерт</span>
                      </div>
                    </div>
                    
                    {/* Цена и кнопка */}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-gray-400 line-through text-sm">{bag.original_price} ₸</span>
                        <span className="text-emerald-600 font-bold text-xl ml-2">{bag.discounted_price} ₸</span>
                        <span className="text-xs text-gray-400 ml-1">скидка -{bag.discount_percentage}%</span>
                      </div>
                      <button
                        onClick={() => handleOrderClick(bag.id)}
                        className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
                      >
                        Заказать
                      </button>
                    </div>
                    
                    {/* Информация о наличии */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-400">
                        Доступно: {bag.available_quantity} шт.
                        {bag.pickup_start_time && ` • Забрать: ${bag.pickup_start_time} - ${bag.pickup_end_time}`}
                      </p>
                    </div>
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