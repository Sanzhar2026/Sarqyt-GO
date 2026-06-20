// app/offers/page.jsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurpriseBagCard from '../components/SurCard';
import { Gift, Store } from 'lucide-react';
import { useLanguage } from './../layout';
import { useGeolocation } from '../context/GeolocationContext';
import GeolocationRequest from '../components/GeolocationRequest';

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
  address?: string;
  pickup_start_time?: string;
  pickup_end_time?: string;
  rating?: number;
  total_reviews?: number;
}

export default function OffersPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const { location, loading: locationLoading, error: locationError, refreshLocation } = useGeolocation();
  
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // ✅ Единая функция для получения токена
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('authToken') || 
           sessionStorage.getItem('courierToken') ||
           null;
  };

  // ✅ Проверка авторизации при монтировании
  useEffect(() => {
    setIsClient(true);
    const token = getAuthToken();
    console.log('🔑 Токен на странице offers:', token ? 'Есть ✅' : 'Нет ❌');
    
    if (!token) {
      console.log('❌ Нет токена, редирект на логин');
      router.push('/login');
    }
  }, [router]);

  const fetchBags = async () => {
    if (!location) {
      console.log('⏳ Ожидание геолокации...');
      return;
    }

    try {
      const { lat, lon } = location;
      console.log(`📍 Текущее положение: ${lat}, ${lon}`);
      
      const token = getAuthToken();
      const response = await fetch(
        `/api/surprise-bags/surprise?lat=${lat}&lon=${lon}`,
        {
          credentials: 'include',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );
      
      console.log('📡 Статус:', response.status);
      
      if (response.status === 401) {
        console.log('❌ Не авторизован, редирект на логин');
        router.push('/login');
        return;
      }
      
      if (!response.ok) {
        console.error('❌ Ошибка:', await response.text());
        setBags([]);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('📦 Получено сюрпризов:', data.length);
      setBags(data);
      
    } catch (error) {
      console.error('❌ Error:', error);
      setBags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location && isClient) {
      fetchBags();
    }
  }, [location, isClient]);

  if (!isClient || loading || locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-bold mb-2">Геолокация недоступна</h2>
          <p className="text-gray-500 text-sm">{locationError}</p>
          <button 
            onClick={refreshLocation}
            className="mt-4 bg-[#367666] text-white px-6 py-2 rounded-xl"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">Определение местоположения...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <GeolocationRequest />
      
      <div className="bg-[#367666] text-white px-4 pt-12 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Сюрприз-пакеты</h1>
          <Gift size={24} className="text-white/80" />
        </div>
        <p className="text-emerald-100 text-sm mt-1">Выберите свой сюрприз-пакет</p>
      </div>

      <div className="p-3">
        {bags.length === 0 ? (
          <div className="text-center py-12">
           <div className="text-5xl mb-3 text-gray-300/50">🎁</div>
            <p className="text-gray-500 text-sm">Все пакеты временно забронированы</p>
            <button 
              onClick={fetchBags}
              className="mt-3 text-[#367666] underline text-sm"
            >
              Обновить
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bags.map((bag) => (
              <SurpriseBagCard
                key={bag.id}
                id={bag.id}
                name={bag.name}
                supplierName={bag.supplier_name}
                price={bag.discounted_price}
                originalPrice={bag.original_price}
                discount={bag.discount_percentage}
                imageUrl={bag.image_url}
                description={bag.description}
                availableQuantity={bag.available_quantity}
                address={bag.address || ''}
                pickupStartTime={bag.pickup_start_time || ''}
                pickupEndTime={bag.pickup_end_time || ''}
                rating={0}
                totalReviews={0}
                onOrderSuccess={fetchBags}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}