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
      
      const url = `/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=10`;
      const response = await fetch(url);
      
      if (!response.ok) {
        setSuppliers([]);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Ошибка запроса:', error);
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
    
    // Маркер пользователя (прыгающая точка, без иконки)
    if (showUserLocation && userLat && userLon) {
      const userIcon = window.L.divIcon({
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-bounce"></div>`,
        iconSize: [16, 16],
        className: 'custom-div-icon'
      });
      
      window.L.marker([userLat, userLon], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Вы здесь');
      
      bounds.push([userLat, userLon]);
    }
    
    // Маркеры поставщиков (прыгающие точки, без иконок)
    validSuppliersWithCoords.forEach(supplier => {
      if (!supplier.lat || !supplier.lon || isNaN(supplier.lat) || isNaN(supplier.lon)) return;
      
      const icon = window.L.divIcon({
        html: `<div class="w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-lg hover:scale-125 transition-transform animate-bounce"></div>`,
        iconSize: [20, 20],
        className: 'custom-div-icon'
      });
      
      // ✅ ПОПАП БЕЗ ИКОНОК!
      const popupContent = `
        <div class="text-center min-w-[200px] p-2">
          <div class="font-bold text-lg mb-1">${supplier.business_name || 'Магазин'}</div>
          <div class="text-sm text-gray-600 mb-2">${supplier.address || 'Адрес не указан'}</div>
          <div class="flex justify-center gap-4 mb-2 text-sm">
            <span>${supplier.rating || 4.5} ★</span>
            <span>${supplier.surprise_bags_count || 0} пакетов</span>
            <span>${supplier.distance_km?.toFixed(1) || '?'} км</span>
          </div>
          <button class="mt-2 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm w-full view-supplier-btn" data-id="${supplier.id}" data-name="${supplier.business_name}">
            Смотреть сюрпризы
          </button>
        </div>
      `;
      
      const marker = window.L.marker([supplier.lat, supplier.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent);
      
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
      <div ref={mapRef} className="w-full h-full rounded-xl" />
      <div className="absolute bottom-2 right-2 bg-white rounded-lg shadow-lg px-2 py-1 text-xs z-10">
        {suppliers.length} магазинов рядом
      </div>
    </div>
  );
}