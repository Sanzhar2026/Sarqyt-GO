// app/page.tsx - УПРОЩЕННАЯ ВЕРСИЯ, ЧТОБЫ НЕ ЛОМАЛАСЬ
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Gift } from 'lucide-react';
import OfferCard from './components/OfferCard';
import { useGeolocation } from './context/GeolocationContext';
import { useLanguage } from './layout';

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
}

export default function HomePage() {
  const { lang } = useLanguage();
  const { location } = useGeolocation();
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBags = async () => {
      const lat = location?.lat || 50.283;
      const lon = location?.lon || 57.167;
      
      try {
        const response = await fetch(`/api/surprise-bags?lat=${lat}&lon=${lon}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setBags(data.filter((bag: SurpriseBag) => bag.available_quantity > 0));
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBags();
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#367666] text-white px-6 pt-6 pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-white">SARQYT</span>{' '}
            <span className="text-[#FFD700]">GO</span>
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 mt-4">
        <div className="flex flex-col gap-3">
          {bags.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Нет предложений</p>
            </div>
          ) : (
            bags.map((bag) => (
              <OfferCard
                key={bag.id}
                id={bag.id}
                name={bag.name}
                businessName={bag.supplier_name}
                distance={`${(Math.random() * 5 + 1).toFixed(1)} км`}
                price={bag.discounted_price}
                originalPrice={bag.original_price}
                discount={bag.discount_percentage}
                imageUrl={bag.image_url}
                description={bag.description}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}