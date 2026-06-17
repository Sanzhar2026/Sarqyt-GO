// app/offers/page.tsx - С ИСПОЛЬЗОВАНИЕМ SurpriseBagCard
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurpriseBagCard from '../components/SurCard';
import { Gift } from 'lucide-react';
import { useLanguage } from '../../layout';

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

  const getAuthToken = () => sessionStorage.getItem('authToken');

  // ✅ Функция для получения координат
  const getUserLocation = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve) => {
      const savedLat = sessionStorage.getItem('user_lat');
      const savedLon = sessionStorage.getItem('user_lon');
      
      if (savedLat && savedLon) {
        resolve({ lat: parseFloat(savedLat), lon: parseFloat(savedLon) });
        return;
      }
      
      if (!navigator.geolocation) {
        resolve({ lat: 43.238, lon: 76.945 });
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          sessionStorage.setItem('user_lat', String(lat));
          sessionStorage.setItem('user_lon', String(lon));
          resolve({ lat, lon });
        },
        () => {
          const lat = parseFloat(sessionStorage.getItem('user_lat') || '43.238');
          const lon = parseFloat(sessionStorage.getItem('user_lon') || '76.945');
          resolve({ lat, lon });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const fetchBags = async () => {
    try {
      // ✅ Получаем координаты
      const { lat, lon } = await getUserLocation();
      console.log(`📍 Запрос сюрпризов для координат: ${lat}, ${lon}`);
      
      // ✅ Добавляем координаты в запрос
      const response = await fetch(
        `https://toogood-2ncf.onrender.com/api/surprise-bags/surprise?lat=${lat}&lon=${lon}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      
      // ✅ Добавляем недостающие поля для SurpriseBagCard
      const bagsWithDetails = await Promise.all(
        data.map(async (bag: SurpriseBag) => {
          try {
            // Получаем рейтинг
            const ratingRes = await fetch(`https://toogood-2ncf.onrender.com/api/surprise-bags/${bag.id}/rating`);
            let rating = 0, total_reviews = 0;
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              rating = ratingData.rating || 0;
              total_reviews = ratingData.total_reviews || 0;
            }
            
            // Получаем адрес и время
            const supplierRes = await fetch(`https://toogood-2ncf.onrender.com/api/suppliers/${bag.supplier_id}`);
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
            console.error('Error fetching details:', e);
          }
          return { 
            ...bag, 
            rating: 0, 
            total_reviews: 0,
            address: '',
            pickup_start_time: '19:30',
            pickup_end_time: '20:30'
          };
        })
      );
      
      setBags(bagsWithDetails);
    } catch (error) {
      console.error('Error fetching bags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    fetchBags();
    const interval = setInterval(fetchBags, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#367666] text-white px-4 pt-12 pb-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {lang === 'kz' ? 'Сюрприз-пакеттер' : 'Сюрприз-пакеты'}
            </h1>
            <Gift size={24} className="text-white/80" />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setLang('kz')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'kz' 
                  ? 'bg-white text-[#367666]' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Қаз
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                lang === 'ru' 
                  ? 'bg-white text-[#367666]' 
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

      <div className="p-3">
        {bags.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎁</div>
            <p className="text-gray-500 text-sm">
              {lang === 'kz' ? 'Барлық пакеттер уақытша броньдалған' : 'Все пакеты временно забронированы'}
            </p>
            <button 
              onClick={fetchBags}
              className="mt-3 text-[#367666] underline text-sm"
            >
              {lang === 'kz' ? 'Жаңарту' : 'Обновить'}
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