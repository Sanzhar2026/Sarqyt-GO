// app/location/page.tsx
'use client';

export default function LocationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-emerald-600 text-white p-6">
        <h2 className="text-xl font-semibold">Quelle est votre localisation ?</h2>
      </div>

      <div className="p-6">
        <input
          type="text"
          placeholder="Adresse"
          className="w-full px-4 py-3 border border-gray-300 rounded-2xl mb-6"
        />

        {/* Map Placeholder */}
        <div className="h-96 bg-gray-200 rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581000000000-000000000000')] bg-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full">
              Map of Paris (use Leaflet/Google Maps here)
            </p>
          </div>
        </div>

        <button className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3">
          <input type="checkbox" className="accent-white" defaultChecked />
          J'autorise la géolocalisation
        </button>
      </div>
    </div>
  );
}