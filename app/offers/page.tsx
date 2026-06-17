'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurpriseBagCard from '../components/SurCard';
import { Gift } from 'lucide-react';
import { useLanguage } from './../layout';

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
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getAuthToken = () => sessionStorage.getItem('authToken');

  // ТОЛЬКО ГЕОЛОКАЦИЯ
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocation({ lat, lon });
        sessionStorage.setItem('user_lat', String(lat));
        sessionStorage.setItem('user_lon', String(lon));
        setLocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Не удалось определить местоположение';
        if (error.code === 1) errorMsg = 'Доступ к геолокации запрещен';
        if (error.code === 2) errorMsg = 'Позиция недоступна';
        if (error.code === 3) errorMsg = 'Таймаут геолокации';
        setLocationError(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const fetchBags = async () => {
    if (!location) {
      console.log('⏳ Ожидание геолокации...');
      return;
    }

    try {
      const { lat, lon } = location;
      console.log(`📍 Текущее положение: ${lat}, ${lon}`);
      
      // ✅ ОТНОСИТЕЛЬНЫЙ ПУТЬ!
      const response = await fetch(
        `/api/surprise-bags/surprise?lat=${lat}&lon=${lon}`,
        { credentials: 'include' }
      );
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📦 Bags received:', data.length);
      
      const bagsWithDetails = await Promise.all(
        data.map(async (bag: SurpriseBag) => {
          try {
            const [ratingRes, supplierRes] = await Promise.all([
              fetch(`/api/surprise-bags/${bag.id}/rating`, { credentials: 'include' }),
              fetch(`/api/suppliers/${bag.supplier_id}`, { credentials: 'include' })
            ]);
            
            let rating = 0, total_reviews = 0;
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              rating = ratingData.rating || 0;
              total_reviews = ratingData.total_reviews || 0;
            }
            
            let address = '', pickupStart = '', pickupEnd = '';
            if (supplierRes.ok) {
              const supplierData = await supplierRes.json();
              address = supplierData.address || '';
              pickupStart = supplierData.pickup_start_time || '19:30';
              pickupEnd = supplierData.pickup_end_time || '20:30';
            }
            
            return { 
              ...bag, 
              rating, 
              total_reviews,
              address,
              pickup_start_time: pickupStart,
              pickup_end_time: pickupEnd
            };
          } catch (e) {
            console.error('Error fetching details for bag:', bag.id, e);
            return { 
              ...bag, 
              rating: 0, 
              total_reviews: 0,
              address: '',
              pickup_start_time: '19:30',
              pickup_end_time: '20:30'
            };
          }
        })
      );
      
      setBags(bagsWithDetails);
    } catch (error) {
      console.error('Error fetching bags:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем сюрпризы когда есть геолокация
  useEffect(() => {
    if (location) {
      fetchBags();
    }
  }, [location]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  if (loading) {
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
            onClick={() => window.location.reload()}
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
            <div className="text-5xl mb-3">🎁</div>
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
                address={bag.address}
                pickupStartTime={bag.pickup_start_time}
                pickupEndTime={bag.pickup_end_time}
                rating={bag.rating}
                totalReviews={bag.total_reviews}
                onOrderSuccess={fetchBags}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}