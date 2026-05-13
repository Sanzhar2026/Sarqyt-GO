// app/HomeClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { getNearbyBags, type Supplier } from '../lib/api';
import OfferCard from './components/OfferCard';

export default function HomeClient() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          const data = await getNearbyBags(lat, lon, 10);
          setSuppliers(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      },
      () => setLoading(false)
    );
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <h1 className="text-2xl font-bold text-emerald-600 mb-6">Sarqyn Food</h1>
      
      {suppliers.length === 0 ? (
        <p className="text-center text-gray-500">Нет предложений рядом</p>
      ) : (
        <div className="space-y-4">
          {suppliers.map((supplier) =>
            supplier.surprise_bags.map((bag) => (
              <OfferCard
                key={bag.id}
                id={bag.id}
                name={bag.name}
                businessName={supplier.business_name}
                distance={`${supplier.distance_km} км`}
                price={bag.discounted_price}
                originalPrice={bag.original_price}
                discount={bag.discount_percentage}
                imageUrl={bag.image_url}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}