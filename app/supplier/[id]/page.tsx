'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import OfferCard from '../../components/OfferCard';
import SurpriseBagCard from '../../components/SurCard';

interface SurpriseBag {
  id: number;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url: string;
  available_quantity: number;
  pickup_start_time?: string;
  pickup_end_time?: string;
   pickup_time?: string; 
  business_type?: string;  // ✅ ИСПРАВЛЕНО!
}

interface Supplier {
  id: number;
  business_name: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  cover_image?: string;
  logo?: string;
  lat?: number;
  lon?: number;
  business_type?: string;  // ✅ ИСПРАВЛЕНО!
}

type ViewMode = 'offers' | 'surprises';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// ✅ ПРОСТАЯ ИКОНКА СПИСОК
const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// ✅ ПРОСТАЯ ИКОНКА ПОДАРКА
const GiftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

export default function SupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('offers');
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  const supplierId = params?.id;

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 50.318754, lon: 57.368359 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      () => {
        setUserLocation({ lat: 50.318754, lon: 57.368359 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!supplierId) return;
      
      try {
        const [supplierRes, bagsRes] = await Promise.all([
          fetch(`/api/suppliers/${supplierId}`),
          fetch(`/api/suppliers/${supplierId}/surprise-bags`)
        ]);
        
        if (supplierRes.ok) {
          const supplierData = await supplierRes.json();
          setSupplier(supplierData);
        }
        
        if (bagsRes.ok) {
          const bagsData = await bagsRes.json();
          setBags(bagsData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [supplierId]);

  const getDistance = (): string => {
    if (!userLocation || !supplier?.lat || !supplier?.lon) {
      return '0 км';
    }
    const dist = calculateDistance(userLocation.lat, userLocation.lon, supplier.lat, supplier.lon);
    if (dist < 1) {
      return `${Math.round(dist * 1000)} м`;
    }
    return `${dist.toFixed(1)} км`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Магазин не найден</p>
      </div>
    );
  }

  const logoUrl = isClient && supplier.logo 
    ? `${supplier.logo}?t=${Date.now()}` 
    : supplier.logo;

  const distance = getDistance();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#367666] text-white p-6">
        <button onClick={() => router.back()} className="mb-4 text-white hover:opacity-80 transition">
          ← Назад
        </button>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50 flex-shrink-0">
            {supplier.logo ? (
              <img
                src={logoUrl || supplier.logo}
                alt={supplier.business_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.className = 'text-2xl font-bold text-white';
                    fallback.textContent = supplier.business_name?.charAt(0)?.toUpperCase() || '?';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {supplier.business_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{supplier.business_name}</h1>
            <p className="text-sm opacity-90 mt-1">{supplier.address}</p>
            <div className="flex items-center gap-3 mt-1">
              {supplier.rating && supplier.rating > 0 && (
                <span className="text-yellow-300 text-sm">★ {supplier.rating}</span>
              )}
              <span className="text-white/60 text-xs">{distance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ ПРОСТЫЕ ИКОНКИ ДЛЯ КЛАДОК */}
      <div className="px-4 pt-4">
        <div className="bg-gray-100/30 backdrop-blur-sm p-1 rounded-2xl flex gap-1 max-w-xs mx-auto border border-gray-200/20">
          <button
            onClick={() => setViewMode('offers')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              viewMode === 'offers' 
                ? 'bg-white/80 shadow-sm text-[#367666]' 
                : 'text-gray-400/70 hover:text-gray-600 hover:bg-white/20'
            }`}
          >
            <ListIcon className="w-5 h-5" />
            <span>Предложения</span>
          </button>
          <button
            onClick={() => setViewMode('surprises')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              viewMode === 'surprises' 
                ? 'bg-white/80 shadow-sm text-[#367666]' 
                : 'text-gray-400/70 hover:text-gray-600 hover:bg-white/20'
            }`}
          >
            <GiftIcon className="w-5 h-5" />
            <span>Сюрпризы</span>
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {viewMode === 'offers' ? 'Предложения' : 'Сюрпризы'}
          </h2>
          <span className="text-sm text-gray-400">{bags.length} шт.</span>
        </div>
        
        {bags.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <GiftIcon className="w-12 h-12 mx-auto text-gray-300/30 mb-3" />
            <p className="text-gray-500">Нет доступных предложений</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bags.map((bag) => (
              viewMode === 'offers' ? (
                <OfferCard
                  key={bag.id}
                  id={bag.id}
                  name={bag.name}
                  businessName={supplier.business_name}
                  businessType={supplier.business_type}  // ✅ ПЕРЕДАЕМ!
                  distance={distance}
                  price={bag.discounted_price}
                  originalPrice={bag.original_price}
                  discount={bag.discount_percentage}
                  imageUrl={bag.image_url}
              
                  description={bag.description}
                />
              ) : (
                <SurpriseBagCard
                  key={bag.id}
                  id={bag.id}
                  name={bag.name}
                  supplierName={supplier.business_name}
                  businessType={supplier.business_type}  // ✅ ПЕРЕДАЕМ!
                  price={bag.discounted_price}
                  originalPrice={bag.original_price}
                  discount={bag.discount_percentage}
                  imageUrl={bag.image_url}
                  description={bag.description}
                  availableQuantity={bag.available_quantity}
                  address={supplier.address}
                
                  distance={distance}  // ✅ ПЕРЕДАЕМ!
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}