// app/offers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurpriseBagCard from '../components/SurCard';
import { Gift } from 'lucide-react';

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
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => sessionStorage.getItem('authToken');

  const fetchBags = async () => {
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/surprise-bags');
      const data = await response.json();
      
      const bagsWithDetails = await Promise.all(
        data.map(async (bag: SurpriseBag) => {
          try {
            const ratingRes = await fetch(`https://toogood-2ncf.onrender.com/api/surprise-bags/${bag.id}/rating`);
            let rating = 0, total_reviews = 0;
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              rating = ratingData.rating || 0;
              total_reviews = ratingData.total_reviews || 0;
            }
            
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
      {/* Header - уменьшен на 35% */}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}