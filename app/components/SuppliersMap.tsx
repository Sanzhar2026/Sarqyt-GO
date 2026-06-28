'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Supplier {
  id: number;
  business_name: string;
  address: string;
  lat: number;
  lon: number;
  rating: number;
  distance_km: number;
  surprise_bags_count: number;
   logo?: string;
}

interface SuppliersMapProps {
  userLat?: number;
  userLon?: number;
  onSupplierClick?: (supplierId: number, supplierName: string) => void;
  showUserLocation?: boolean;
}

export default function SuppliersMap({ 
  userLat, 
  userLon, 
  onSupplierClick, 
  showUserLocation = true
}: SuppliersMapProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Загрузка Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;
      if (window.L) {
        setMapLoaded(true);
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };
    loadLeaflet();
  }, []);
const fetchNearbySuppliers = async (lat: number, lon: number) => {
  try {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    
    // ✅ УВЕЛИЧИЛИ РАДИУС ДО 30 КМ
    const url = `/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=30`;
    console.log('📡 Запрос:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    
    const data = await response.json();
    console.log('📦 Получено магазинов:', data.suppliers?.length || 0);
    
    // ✅ ПОКАЗЫВАЕМ ВСЕХ, ДАЖЕ ДАЛЬНИХ
    const validSuppliers = (data.suppliers || []).filter((s: any) => {
      return s.lat && s.lon && !isNaN(s.lat) && !isNaN(s.lon);
    });
    
    setSuppliers(validSuppliers);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    setSuppliers([]);
  } finally {
    setLoading(false);
  }
};

  // Получение геолокации
  useEffect(() => {
    if (userLat && userLon) {
      fetchNearbySuppliers(userLat, userLon);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbySuppliers(position.coords.latitude, position.coords.longitude);
        },
        () => { 
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, [userLat, userLon]);

  // Функция центрирования на пользователе
  const centerOnUser = () => {
    if (mapInstanceRef.current && userLat && userLon) {
      mapInstanceRef.current.setView([userLat, userLon], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }
  };

  // Инициализация карты
  useEffect(() => {
    if (!mapLoaded || loading || suppliers.length === 0) return;
    if (!mapRef.current || mapInstanceRef.current) return;
    
    const validSuppliersWithCoords = suppliers.filter(s => s.lat && s.lon);
    if (validSuppliersWithCoords.length === 0) return;
    
    const centerLat = userLat || validSuppliersWithCoords[0].lat || 43.238;
    const centerLon = userLon || validSuppliersWithCoords[0].lon || 76.945;
    
    mapInstanceRef.current = window.L.map(mapRef.current).setView([centerLat, centerLon], 12);
    
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstanceRef.current);
    
    const bounds: any[] = [];
    
    // Увеличенный маркер пользователя
    if (showUserLocation && userLat && userLon) {
      const userIcon = window.L.divIcon({
        html: `<div class="w-[26px] h-[26px] bg-blue-500 rounded-full border-4 border-white shadow-2xl animate-bounce"></div>`,
        iconSize: [26, 26],
        className: 'custom-div-icon'
      });
      
      userMarkerRef.current = window.L.marker([userLat, userLon], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('📍 Вы здесь');
      
      bounds.push([userLat, userLon]);
    }
    
    // Увеличенные маркеры поставщиков
validSuppliersWithCoords.forEach(supplier => {
  if (!supplier.lat || !supplier.lon || isNaN(supplier.lat) || isNaN(supplier.lon)) return;
  
  const icon = window.L.divIcon({
    html: `<div class="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-2xl hover:scale-125 transition-transform"></div>`,
    iconSize: [32, 32],
    className: 'custom-div-icon'
  });
  
  // ✅ ПОПАП С АВАТАРКОЙ
  const popupContent = `
    <div class="text-center min-w-[220px] p-3">
      <!-- АВАТАРКА ПОСТАВЩИКА -->
      <div class="flex justify-center mb-2">
        ${supplier.logo ? `
          <img 
            src="${supplier.logo}" 
            alt="${supplier.business_name}"
            class="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-md"
            onerror="this.style.display='none'"
          />
        ` : `
          <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-600 border-2 border-emerald-500 shadow-md">
            ${supplier.business_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        `}
      </div>
      
      <!-- НАЗВАНИЕ -->
      <div class="font-bold text-lg text-gray-800 mb-0.5">${supplier.business_name || 'Магазин'}</div>
      
      <!-- АДРЕС -->
      <div class="text-sm text-gray-500 mb-2">${supplier.address || 'Адрес не указан'}</div>
      
      <!-- РЕЙТИНГ, ПАКЕТЫ, РАССТОЯНИЕ -->
      <div class="flex justify-center gap-4 mb-2 text-sm">
        <span class="flex items-center gap-1">⭐ ${supplier.rating || 4.5}</span>
        <span class="flex items-center gap-1">📦 ${supplier.surprise_bags_count || 0}</span>
        <span class="flex items-center gap-1">📍 ${supplier.distance_km?.toFixed(1) || '?'} км</span>
      </div>
      
      <!-- КНОПКА -->
      <button class="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm w-full transition view-supplier-btn" 
              data-id="${supplier.id}" 
              data-name="${supplier.business_name}">
        🛒 Смотреть сюрпризы
      </button>
    </div>
  `;
  
  const marker = window.L.marker([supplier.lat, supplier.lon], { icon })
    .addTo(mapInstanceRef.current)
    .bindPopup(popupContent, {
      className: 'supplier-popup',
      maxWidth: 260,
      minWidth: 220
    });
  
  marker.on('popupopen', () => {
    const btn = document.querySelector(`.view-supplier-btn[data-id="${supplier.id}"]`);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.push(`/supplier/${supplier.id}`);
      });
    }
  });
  
  bounds.push([supplier.lat, supplier.lon]);
});
    setTimeout(() => {
      document.querySelectorAll('.view-supplier-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt((e.target as HTMLElement).getAttribute('data-id') || '0');
          const name = (e.target as HTMLElement).getAttribute('data-name') || '';
          
          if (id) {
            router.push(`/supplier/${id}`);
          }
          
          if (onSupplierClick && id) {
            onSupplierClick(id, name);
          }
        });
      });
    }, 100);
    
    if (bounds.length > 0) {
      const mapBounds = window.L.latLngBounds(bounds);
      mapInstanceRef.current.fitBounds(mapBounds, { padding: [50, 50] });
    }
    
  }, [mapLoaded, loading, suppliers, userLat, userLon, onSupplierClick, showUserLocation, router]);

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Рядом нет магазинов</p>
          <button 
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => fetchNearbySuppliers(position.coords.latitude, position.coords.longitude),
                  () => {}
                );
              }
            }}
            className="mt-2 text-emerald-600 text-xs underline"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* ✅ КАРТА */}
      <div ref={mapRef} className="w-full h-full rounded-xl" />
      
      <style jsx>{`
        :global(.custom-div-icon) {
          background: transparent !important;
          border: none !important;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        :global(.animate-bounce) {
          animation: bounce 0.8s ease-in-out infinite;
        }
        :global(.hover\\:scale-125:hover) {
          transform: scale(1.25);
        }
        :global(.transition-transform) {
          transition: transform 0.2s ease;
        }
        /* ✅ КНОПКА НА ПОВЕРХНОСТИ КАРТЫ */
        .map-button {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 1000 !important;
          background: white;
          border: none;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          padding: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .map-button:hover {
          background: #f3f4f6;
          transform: scale(1.05);
        }
        .map-button:active {
          transform: scale(0.95);
        }
        .map-button svg {
          width: 24px;
          height: 24px;
          color: #3b82f6;
        }
        /* ✅ СЧЕТЧИК МАГАЗИНОВ */
        .store-counter {
          position: absolute;
          bottom: 20px;
          left: 20px;
          z-index: 1000 !important;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 4px 12px;
          font-size: 12px;
          color: #6b7280;
        }
      `}</style>
      
      {/* ✅ КНОПКА ЦЕНТРИРОВАНИЯ НА ПОВЕРХНОСТИ КАРТЫ */}
      <button
        onClick={centerOnUser}
        className="map-button"
        title="Показать моё местоположение"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {/* ✅ СЧЕТЧИК МАГАЗИНОВ */}
      <div className="store-counter">
        {suppliers.length} магазинов рядом
      </div>
    </div>
  );
}