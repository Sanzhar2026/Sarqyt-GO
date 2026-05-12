'use client'

import Image from 'next/image'
import Link from 'next/link'
import { type SurpriseBag, type Supplier } from '../../lib/api'
import { translations, type Language } from '../../lib/i18n'

interface Props {
  bag: SurpriseBag
  supplier: Supplier
  lang: Language
}

export default function OfferCard({ bag, supplier, lang }: Props) {
  const t = translations[lang]

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4">
      <div className="relative h-48">
        <Image
          src={bag.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
          alt={bag.name}
          fill
          className="object-cover"
        />
        {bag.discount_percentage > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full">
            -{bag.discount_percentage}% {t.discount}
          </div>
        )}
        {supplier.distance_km && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
            {supplier.distance_km} {t.km}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-xl">{bag.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{supplier.business_name}</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 font-medium">
            ★ {supplier.rating}
          </div>
        </div>

        <p className="text-gray-500 text-sm mt-2 line-clamp-2">{bag.description}</p>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-bold text-emerald-600">{bag.discounted_price} ₸</span>
          <span className="text-gray-400 line-through text-lg">{bag.original_price} ₸</span>
        </div>

        {bag.pickup_start_time && bag.pickup_end_time && (
          <p className="text-xs text-gray-400 mt-1">
            🕐 {t.pickupTime}: {bag.pickup_start_time} - {bag.pickup_end_time}
          </p>
        )}

        <Link href={`/offers/${bag.id}`}>
          <button className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold transition-colors">
            {t.reserve} →
          </button>
        </Link>
      </div>
    </div>
  )
}