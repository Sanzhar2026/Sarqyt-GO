// app/components/GeolocationRequest.tsx
'use client';

import { useGeolocation } from '../context/GeolocationContext';

export default function GeolocationRequest() {
  const { error, refreshLocation, loading, location } = useGeolocation();

  if (!error || location) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 mx-4">
      <div className="bg-white rounded-2xl shadow-xl border border-yellow-200 p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-1">📍</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">Нужен доступ к геолокации</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <button
            onClick={refreshLocation}
            disabled={loading}
            className="bg-[#367666] text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap hover:bg-[#2a5a4d] disabled:opacity-50 transition"
          >
            {loading ? '⏳' : '🔄 Попробовать'}
          </button>
        </div>
      </div>
    </div>
  );
}