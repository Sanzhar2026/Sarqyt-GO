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
  business_type?: string;
  new_bags_count?: number;
}

interface SuppliersMapProps {
  userLat?: number;
  userLon?: number;
  onSupplierClick?: (supplierId: number, supplierName: string) => void;
  showUserLocation?: boolean;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Ресторан',
  cafe: 'Кафе',
  fastfood: 'Фастфуд',
  bakery: 'Пекарня',
  supermarket: 'Супермаркет',
  store: 'Магазин',
};

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
};

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
  const markerRefs = useRef<Map<number, any>>(new Map());

  // ✅ ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ ПЕРЕХОДА
  useEffect(() => {
    // @ts-ignore
    window.goToSupplier = (id: number) => {
      console.log('🛒 ПЕРЕХОД К ПОСТАВЩИКУ:', id);
      if (id > 0) {
        router.push(`/supplier/${id}`);
      }
    };
    return () => {
      // @ts-ignore
      delete window.goToSupplier;
    };
  }, [router]);

  const markSupplierAsViewed = async (supplierId: number) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch('/api/suppliers/mark-viewed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ supplier_id: supplierId })
      });
      
      if (response.ok) {
        console.log(`✅ Поставщик ${supplierId} отмечен как просмотренный`);
        // ✅ ОБНОВЛЯЕМ ТОЛЬКО ЭТОГО ПОСТАВЩИКА В STATE
        setSuppliers(prev => {
          const index = prev.findIndex(s => s.id === supplierId);
          if (index === -1) return prev;
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            new_bags_count: 0
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('❌ Ошибка отметки просмотра:', error);
    }
  };

  // WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWebSocket = () => {
      const token = getAuthToken();
      if (!token) {
        console.log('⚠️ Нет токена, WebSocket не подключается');
        return;
      }
      
      const wsUrl = `wss://toogood-production.up.railway.app/ws`;
      
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ WebSocket connected (map)');
          ws.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'new_bag' || data.type === 'update_bag') {
              const bag = data.data;
              console.log('🆕 Новый сюрприз от поставщика:', bag.supplier_id);
              
              if (bag.supplier_id) {
                // ✅ ОБНОВЛЯЕМ ТОЛЬКО КОНКРЕТНОГО ПОСТАВЩИКА
                setSuppliers(prev => {
                  const index = prev.findIndex(s => s.id === bag.supplier_id);
                  if (index === -1) return prev;
                  const updated = [...prev];
                  updated[index] = {
                    ...updated[index],
                    new_bags_count: (updated[index].new_bags_count || 0) + 1
                  };
                  return updated;
                });
              }
            }
          } catch (e) {
            console.error('❌ WebSocket message error:', e);
          }
        };
        
        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected (map)');
          setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };
        
      } catch (error) {
        console.error('❌ WebSocket connection error:', error);
      }
    };
    
    connectWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, []);

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
      
      const url = `/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=30`;
      
      const token = getAuthToken();
      const response = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        setSuppliers([]);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
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

  const centerOnUser = () => {
    if (mapInstanceRef.current && userLat && userLon) {
      mapInstanceRef.current.setView([userLat, userLon], 15);
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }
  };

  // ✅ СОЗДАНИЕ КАРТЫ + МАРКЕРОВ (ТОЛЬКО 1 РАЗ)
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
    
    if (showUserLocation && userLat && userLon) {
      const userIcon = window.L.divIcon({
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>`,
        iconSize: window.L.point(16, 16),
        className: 'custom-div-icon'
      });
      
      userMarkerRef.current = window.L.marker([userLat, userLon], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('📍 Вы здесь');
      
      bounds.push([userLat, userLon]);
    }
    
    validSuppliersWithCoords.forEach(supplier => {
      if (!supplier.lat || !supplier.lon || isNaN(supplier.lat) || isNaN(supplier.lon)) return;
      
      const hasNewBags = supplier.new_bags_count && supplier.new_bags_count > 0;
      const iconColor = hasNewBags ? 'bg-green-500' : 'bg-gray-400';
      
      const badge = hasNewBags && supplier.new_bags_count 
        ? `<div class="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold rounded-full w-5 h-5 flex items-center justify-center z-20 border-2 border-white">
            ${supplier.new_bags_count}
          </div>`
        : '';
      
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          ${hasNewBags ? `
            <div class="absolute -inset-3 rounded-full border-[6px] border-green-500 animate-pulse-ring" style="width: 30px; height: 30px;"></div>
          ` : ''}
          ${badge}
          <div class="w-4 h-4 ${iconColor} rounded-full border-2 border-white shadow relative z-10"></div>
        </div>
      `;
      
      const icon = window.L.divIcon({
        html: iconHtml,
        iconSize: window.L.point(16, 16),
        className: 'custom-div-icon',
        iconAnchor: window.L.point(8, 8)
      });
      
      const businessTypeLabel = supplier.business_type 
        ? BUSINESS_TYPE_LABELS[supplier.business_type] || supplier.business_type
        : '';
      
      const popupContent = `
        <div class="text-center min-w-[220px] p-3">
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
          
          <div class="font-bold text-lg text-gray-800 mb-0.5">${supplier.business_name || 'Магазин'}</div>
          
          ${businessTypeLabel ? `
            <div class="text-xs text-gray-400 mb-1">${businessTypeLabel}</div>
          ` : ''}
          
          <div class="text-sm text-gray-500 mb-2">${supplier.address || 'Адрес не указан'}</div>
          
          <div class="flex justify-center gap-4 mb-2 text-sm">
            <span>⭐ ${supplier.rating || '—'}</span>
            <span>${supplier.surprise_bags_count || 0}</span>
            <span>${supplier.distance_km?.toFixed(1) || '?'} км</span>
          </div>
          
          ${hasNewBags ? `
            <div class="text-xs text-green-600 font-medium mb-2">
              🔔 ${supplier.new_bags_count} новых сюрпризов!
            </div>
          ` : ''}
          
          <button class="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm w-full transition" 
                  onclick="window.goToSupplier(${supplier.id})">
            Смотреть сюрпризы
          </button>
        </div>
      `;
      
      const marker = window.L.marker([supplier.lat, supplier.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent, {
          className: 'supplier-popup',
          maxWidth: 260,
          minWidth: 220,
          autoPan: false,
          keepInView: false
        });
      
      markerRefs.current.set(supplier.id, marker);
      
      marker.on('click', () => {
        marker.openPopup();
      });
      
      marker.on('popupopen', () => {
        markSupplierAsViewed(supplier.id);
      });
      
      bounds.push([supplier.lat, supplier.lon]);
    });
    
    if (bounds.length > 0) {
      const mapBounds = window.L.latLngBounds(bounds);
      mapInstanceRef.current.fitBounds(mapBounds, { padding: [50, 50] });
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRefs.current.clear();
      }
    };
    
  }, [mapLoaded, loading, suppliers, userLat, userLon, showUserLocation]);

  // ✅ ОБНОВЛЕНИЕ МАРКЕРОВ (БЕЗ ПЕРЕРИСОВКИ КАРТЫ!)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (suppliers.length === 0) return;
    
    suppliers.forEach(supplier => {
      if (!supplier.lat || !supplier.lon || isNaN(supplier.lat) || isNaN(supplier.lon)) return;
      
      const marker = markerRefs.current.get(supplier.id);
      if (!marker) return;
      
      const hasNewBags = supplier.new_bags_count && supplier.new_bags_count > 0;
      const iconColor = hasNewBags ? 'bg-green-500' : 'bg-gray-400';
      
      const badge = hasNewBags && supplier.new_bags_count 
        ? `<div class="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold rounded-full w-5 h-5 flex items-center justify-center z-20 border-2 border-white">
            ${supplier.new_bags_count}
          </div>`
        : '';
      
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          ${hasNewBags ? `
            <div class="absolute -inset-3 rounded-full border-[6px] border-green-500 animate-pulse-ring" style="width: 30px; height: 30px;"></div>
          ` : ''}
          ${badge}
          <div class="w-4 h-4 ${iconColor} rounded-full border-2 border-white shadow relative z-10"></div>
        </div>
      `;
      
      const newIcon = window.L.divIcon({
        html: iconHtml,
        iconSize: window.L.point(16, 16),
        className: 'custom-div-icon',
        iconAnchor: window.L.point(8, 8)
      });
      
      // ✅ МЕНЯЕМ ТОЛЬКО ИКОНКУ! КАРТА НЕ ТРОГАЕТСЯ!
      marker.setIcon(newIcon);
      
      // ✅ ОБНОВЛЯЕМ ПОПАП
      const businessTypeLabel = supplier.business_type 
        ? BUSINESS_TYPE_LABELS[supplier.business_type] || supplier.business_type
        : '';
      
      const popupContent = `
        <div class="text-center min-w-[220px] p-3">
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
          
          <div class="font-bold text-lg text-gray-800 mb-0.5">${supplier.business_name || 'Магазин'}</div>
          
          ${businessTypeLabel ? `
            <div class="text-xs text-gray-400 mb-1">${businessTypeLabel}</div>
          ` : ''}
          
          <div class="text-sm text-gray-500 mb-2">${supplier.address || 'Адрес не указан'}</div>
          
          <div class="flex justify-center gap-4 mb-2 text-sm">
            <span>⭐ ${supplier.rating || '—'}</span>
            <span>${supplier.surprise_bags_count || 0}</span>
            <span>${supplier.distance_km?.toFixed(1) || '?'} км</span>
          </div>
          
          ${hasNewBags ? `
            <div class="text-xs text-green-600 font-medium mb-2">
              🔔 ${supplier.new_bags_count} новых сюрпризов!
            </div>
          ` : ''}
          
          <button class="mt-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm w-full transition" 
                  onclick="window.goToSupplier(${supplier.id})">
            Смотреть сюрпризы
          </button>
        </div>
      `;
      
      // ✅ ОБНОВЛЯЕМ ПОПАП БЕЗ ПЕРЕСОЗДАНИЯ МАРКЕРА
      marker._popup?.setContent(popupContent);
    });
    
  }, [suppliers]);

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
      <div ref={mapRef} className="w-full h-full rounded-xl" />
      
      <style jsx>{`
        :global(.custom-div-icon) {
          background: transparent !important;
          border: none !important;
        }
        
        :global(.animate-pulse-ring) {
          animation: pulse-ring 1.5s ease-out infinite;
          border-color: #22c55e !important;
          border-width: 6px !important;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          50% {
            transform: scale(1.6);
            opacity: 0.4;
          }
          100% {
            transform: scale(0.8);
            opacity: 1;
          }
        }
        
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
        :global(.supplier-popup .leaflet-popup-content-wrapper) {
          border-radius: 16px !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        :global(.supplier-popup .leaflet-popup-content) {
          margin: 0 !important;
          padding: 0 !important;
          min-width: 220px !important;
        }
        :global(.supplier-popup .leaflet-popup-tip) {
          background: white !important;
        }
      `}</style>
      
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
      
      <div className="store-counter">
        {suppliers.length} магазинов рядом
      </div>
    </div>
  );
}