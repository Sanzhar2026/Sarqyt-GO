// app/offers/page.tsx - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ (БЕЗ ОШИБОК SSR)

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import SurpriseBagCard from '../components/SurCard';
import { Gift } from 'lucide-react';
import { useLanguage } from '../components/LanguageSwitcher';
import { useGeolocation } from '../context/GeolocationContext';
import GeolocationRequest from '../components/GeolocationRequest';

// ✅ ФУНКЦИЯ РАСЧЕТА РАССТОЯНИЯ
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
  pickup_time?: string; 
  total_reviews?: number;
  business_type?: string;
  supplier_lat?: number;
  supplier_lon?: number;
}

// ✅ КОМПОНЕНТ С useSearchParams ОБЕРНУТ В SUSPENSE
function OffersContent() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { location, loading: locationLoading, error: locationError, refreshLocation } = useGeolocation();
  const searchParams = useSearchParams();
  
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('authToken') || 
           sessionStorage.getItem('courierToken') ||
           null;
  };

  // ✅ ТОЛЬКО КЛИЕНТ
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
    // ✅ ПРОВЕРКА НА КЛИЕНТЕ
    if (typeof window === 'undefined') return;
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

  // ✅ ЗАГРУЗКА
  if (!isClient || loading || locationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    );
  }

  // ✅ ОШИБКА ГЕОЛОКАЦИИ
  if (locationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-bold mb-2">{t('error')}</h2>
          <p className="text-gray-500 text-sm">{locationError}</p>
          <button 
            onClick={refreshLocation}
            className="mt-4 bg-[#367666] text-white px-6 py-2 rounded-xl"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  // ✅ НЕТ ЛОКАЦИИ
  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // ✅ ОСНОВНОЙ РЕНДЕР
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <GeolocationRequest />
      
      <div className="bg-[#367666] text-white px-4 pt-12 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{t('surpriseBags')}</h1>
          <Gift size={24} className="text-white/40" />
        </div>
        <p className="text-emerald-100 text-sm mt-1">{t('chooseSurprise')}</p>
      </div>

      <div className="p-3">
        {bags.length === 0 ? (
          <div className="text-center py-12">
            <Gift size={48} className="mx-auto text-gray-300/30 mb-3" />
            <p className="text-gray-500 text-sm">{t('noBags')}</p>
            <button 
              onClick={fetchBags}
              className="mt-3 text-[#367666] underline text-sm"
            >
              {t('refresh')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bags.map((bag) => {
              // ✅ РАССЧИТЫВАЕМ РАССТОЯНИЕ
              let distanceText = '0 км';
              
              if (location && bag.supplier_lat && bag.supplier_lon) {
                const dist = calculateDistance(
                  location.lat, 
                  location.lon, 
                  bag.supplier_lat, 
                  bag.supplier_lon
                );
                distanceText = dist < 1 
                  ? `${Math.round(dist * 1000)} м` 
                  : `${dist.toFixed(1)} км`;
              }
              
              return (
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
                  rating={bag.rating || 0}
                  totalReviews={bag.total_reviews || 0}
                  businessType={bag.business_type || ''}
                    pickupTime={bag.pickup_time}  // ✅ ДОБАВЛЕНО!
                  distance={distanceText}
                  onOrderSuccess={fetchBags}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ ОСНОВНОЙ КОМПОНЕНТ С SUSPENSE ДЛЯ useSearchParams
export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#367666]"></div>
      </div>
    }>
      <OffersContent />
    </Suspense>
  );
}