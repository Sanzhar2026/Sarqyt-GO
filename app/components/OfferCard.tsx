// components/OfferCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

type Props = {
  id: number;
  name: string;
  businessName: string;
  distance: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl?: string;
  lang?: 'kz' | 'ru';
};

export default function OfferCard({
  id,
  name,
  businessName,
  distance,
  price,
  originalPrice,
  discount,
  imageUrl,
  lang = 'kz'
}: Props) {
  return (
    <Link href={`/offers/${id}`} className="block cursor-pointer">
      <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition active:scale-[0.98]">
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-24 h-24 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
            {imageUrl ? (
              <Image 
                src={imageUrl} 
                alt={name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-emerald-100 to-emerald-200">
                🍽️
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{name}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{businessName}</p>
                <p className="text-gray-400 text-xs mt-1">📍 {distance}</p>
              </div>
              {discount > 0 && (
                <div className="bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
                  -{discount}%
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <span className="text-emerald-600 font-bold text-xl">{price} ₸</span>
              {originalPrice > price && (
                <span className="text-gray-400 line-through text-sm">{originalPrice} ₸</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}