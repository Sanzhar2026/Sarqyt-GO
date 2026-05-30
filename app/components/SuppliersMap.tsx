// app/components/SuppliersMap.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ
'use client';

import { useEffect, useState, useRef } from 'react';

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
  onSupplierClick?: (supplierId: number) => void;
}

export default function SuppliersMap({ userLat, userLon, onSupplierClick }: SuppliersMapProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const API_URL = 'https://toogood-2ncf.onrender.com';

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

  // Загрузка поставщиков
  const fetchNearbySuppliers = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`${API_URL}/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=10`);
      const data = await response.json();
      
      // ✅ ФИЛЬТРУЕМ ТОЛЬКО ПОСТАВЩИКОВ С КООРДИНАТАМИ
      const validSuppliers = (data.suppliers || []).filter(
        (supplier: Supplier) => 
          supplier.lat && 
          supplier.lon && 
          typeof supplier.lat === 'number' && 
          typeof supplier.lon === 'number' &&
          !isNaN(supplier.lat) && 
          !isNaN(supplier.lon)
      );
      
      setSuppliers(validSuppliers);
      console.log(`📍 Найдено поставщиков: ${validSuppliers.length} из ${data.suppliers?.length || 0}`);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // Получаем геолокацию
  useEffect(() => {
    if (userLat && userLon) {
      fetchNearbySuppliers(userLat, userLon);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearbySuppliers(position.coords.latitude, position.coords.longitude);
        },
        (error) => { 
          console.error('Geolocation error:', error); 
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
    
    // ✅ НАХОДИМ ЦЕНТР КАРТЫ (первый валидный поставщик или Алматы)
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
    
    // ✅ ДОБАВЛЯЕМ МАРКЕРЫ ТОЛЬКО ДЛЯ ВАЛИДНЫХ ПОСТАВЩИКОВ
    const bounds: any[] = [];
    
    validSuppliersWithCoords.forEach(supplier => {
      // ✅ ПРОВЕРКА КООРДИНАТ ПЕРЕД СОЗДАНИЕМ МАРКЕРА
      if (!supplier.lat || !supplier.lon) {
        console.warn(`⚠️ Поставщик ${supplier.id} (${supplier.business_name}) не имеет координат`);
        return;
      }
      
      if (isNaN(supplier.lat) || isNaN(supplier.lon)) {
        console.warn(`⚠️ Поставщик ${supplier.id} имеет некорректные координаты: ${supplier.lat}, ${supplier.lon}`);
        return;
      }
      
      const icon = window.L.divIcon({
        html: `<div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-2 border-white">🏪</div>`,
        iconSize: [40, 40],
        className: 'custom-div-icon'
      });
      
      const marker = window.L.marker([supplier.lat, supplier.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center min-w-[200px]">
            <div class="font-bold text-lg">${supplier.business_name || 'Магазин'}</div>
            <div class="text-sm text-gray-600">${supplier.address || 'Адрес не указан'}</div>
            <div class="flex justify-center gap-2 mt-2 text-sm">
              <span>⭐ ${supplier.rating || 4.5}</span>
              <span>📦 ${supplier.surprise_bags_count || 0} сюрпризов</span>
              <span>📍 ${supplier.distance_km?.toFixed(1) || '?'} км</span>
            </div>
            <button class="mt-3 bg-emerald-600 text-white px-4 py-1 rounded-lg text-sm view-offers-btn" data-id="${supplier.id}">
              Смотреть сюрпризы
            </button>
          </div>
        `);
      
      bounds.push([supplier.lat, supplier.lon]);
    });
    
    // Обработчик кликов
    setTimeout(() => {
      document.querySelectorAll('.view-offers-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt((e.target as HTMLElement).dataset.id || '0');
          if (id && onSupplierClick) onSupplierClick(id);
        });
      });
    }, 100);
    
    // Масштабируем карту под все маркеры
    if (bounds.length > 0) {
      const mapBounds = window.L.latLngBounds(bounds);
      mapInstanceRef.current.fitBounds(mapBounds, { padding: [50, 50] });
    }
    
  }, [mapLoaded, loading, suppliers, userLat, userLon, onSupplierClick]);

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
          <div className="text-4xl mb-2">📍</div>
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
      <div className="absolute bottom-2 right-2 bg-white rounded-lg shadow-lg px-2 py-1 text-xs">
        {suppliers.length} магазинов рядом
      </div>
    </div>
  );
}