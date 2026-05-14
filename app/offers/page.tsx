// app/offers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNearbyBags, type Supplier } from '../../lib/api';
import OfferCard from '../components/OfferCard';
import { useLanguage } from '../layout';

export default function OffersPage() {
  const router = useRouter();
  const { lang } = useLanguage(); // ← язык для перевода
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Переводы
  const t = {
    kz: {
      title: 'Барлық ұсыныстар',
      subtitle: 'Жақын маңдағы тосын сыйлар',
      searchPlaceholder: 'Мейрамхана немесе тағам іздеу...',
      noResults: 'Тағам табылмады',
    },
    ru: {
      title: 'Все предложения',
      subtitle: 'Сюрпризы рядом с вами',
      searchPlaceholder: 'Поиск ресторана или блюда...',
      noResults: 'Блюда не найдены',
    },
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          try {
            const data = await getNearbyBags(lat, lon, 20);
            setSuppliers(data);
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        },
        () => setLoading(false)
      );
    } else {
      setLoading(false);
    }
  }, []);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.surprise_bags.some(bag => 
      bag.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-emerald-600 text-white px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold">🔍 {t[lang].title}</h1>
        <p className="text-emerald-100 text-sm mt-1">{t[lang].subtitle}</p>
      </div>

      <div className="px-6 -mt-4">
        <input
          type="text"
          placeholder={t[lang].searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-6 py-4 rounded-3xl bg-white shadow text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="px-6 mt-6 pb-24">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500">{t[lang].noResults}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSuppliers.map((supplier) =>
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
    </div>
  );
}