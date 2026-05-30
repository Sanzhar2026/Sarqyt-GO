// app/components/DeliveryMapWithRoute.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    L: any;
  }
}

interface Waypoint {
  lat: number;
  lon: number;
}

interface DeliveryMapWithRouteProps {
  orderId: number;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  supplierName: string;
  customerAddress: string;
  onProgressUpdate?: (progress: number) => void;
}

export default function DeliveryMapWithRoute({
  orderId,
  startLat,
  startLon,
  endLat,
  endLon,
  supplierName,
  customerAddress,
  onProgressUpdate
}: DeliveryMapWithRouteProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeLoaded, setRouteLoaded] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const animationIntervalRef = useRef<any>(null);

  // Получаем текущую геолокацию курьера
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLocation({ lat, lon });
        console.log(`📍 Текущее положение курьера: ${lat}, ${lon}`);
        setLocationError(null);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Не удалось определить местоположение');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
      script.onload = () => {
        console.log('✅ Leaflet загружен');
        setMapLoaded(true);
      };
      script.onerror = () => {
        console.error('❌ Ошибка загрузки Leaflet');
      };
      document.head.appendChild(script);
    };
    
    loadLeaflet();
  }, []);

  // Загрузка маршрута через API
  useEffect(() => {
    if (!mapLoaded || !userLocation || !endLat || !endLon) {
      console.log('⏳ Ожидание данных:', { mapLoaded, userLocation: !!userLocation, endLat, endLon });
      return;
    }
    
    const fetchRoute = async () => {
      try {
        console.log('🔄 Загрузка маршрута ORS...');
        console.log('📍 Старт (курьер):', userLocation.lat, userLocation.lon);
        console.log('📍 Финиш (ресторан):', endLat, endLon);
        
        const response = await fetch(`/api/delivery/route/${orderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            start_lat: userLocation.lat,
            start_lon: userLocation.lon,
            end_lat: endLat,
            end_lon: endLon
          })
        });
        
        const data = await response.json();
        console.log('📦 Ответ ORS:', data);
        
        if (data.success && data.waypoints && data.waypoints.length > 0) {
          setWaypoints(data.waypoints);
          setTotalDistance(data.distance_km);
          setTotalDuration(data.duration_min);
          setRouteLoaded(true);
          
          setTimeout(() => initMap(data), 100);
        } else {
          console.error('❌ Ошибка загрузки маршрута:', data);
        }
      } catch (error) {
        console.error('❌ Ошибка fetchRoute:', error);
      }
    };
    
    fetchRoute();
  }, [mapLoaded, userLocation, endLat, endLon, orderId]);

  const initMap = (routeData: any) => {
    if (!window.L || mapInstanceRef.current) return;
    if (!mapRef.current) return;
    
    console.log('🗺️ Инициализация карты...');
    
    const centerLat = userLocation?.lat || routeData.start_lat;
    const centerLon = userLocation?.lon || routeData.start_lon;
    
    mapInstanceRef.current = window.L.map(mapRef.current).setView([centerLat, centerLon], 13);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstanceRef.current);
    
    // Иконка ресторана
    const endIcon = window.L.divIcon({
      html: '<div style="background:#dc2626; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid white;">🏪</div>',
      iconSize: [40, 40]
    });
    window.L.marker([routeData.end_lat, routeData.end_lon], { icon: endIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`🏪 ${supplierName}`);
    
    // Маршрут
    if (routeData.waypoints && routeData.waypoints.length > 0) {
      const latlngs = routeData.waypoints.map((p: Waypoint) => [p.lat, p.lon]);
      window.L.polyline(latlngs, { color: '#fbbf24', weight: 5, dashArray: '8,8' }).addTo(mapInstanceRef.current);
      mapInstanceRef.current.fitBounds(latlngs, { padding: [50, 50] });
    }
    
    // Машина курьера
    const carIcon = window.L.divIcon({
      html: '<div style="background:#3b82f6; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; border:3px solid white; box-shadow:0 2px 10px rgba(59,130,246,0.4);">🚚</div>',
      iconSize: [45, 45]
    });
    driverMarkerRef.current = window.L.marker([userLocation?.lat || routeData.start_lat, userLocation?.lon || routeData.start_lon], { icon: carIcon })
      .addTo(mapInstanceRef.current);
    
    console.log('✅ Карта инициализирована');
  };

  const updateCarPosition = (progress: number) => {
    if (!driverMarkerRef.current || waypoints.length === 0) return;
    
    const idx = Math.floor((progress / 100) * (waypoints.length - 1));
    const safeIdx = Math.min(Math.max(idx, 0), waypoints.length - 1);
    const point = waypoints[safeIdx];
    
    driverMarkerRef.current.setLatLng([point.lat, point.lon]);
  };

  const startAnimation = () => {
    if (isAnimating) {
      console.log('Анимация уже запущена');
      return;
    }
    if (waypoints.length === 0) {
      console.error('Нет точек маршрута');
      return;
    }
    
    console.log('🚚 Запуск анимации доставки...');
    setIsAnimating(true);
    
    let progress = 0;
    const totalDurationMs = 30 * 60 * 1000;
    const stepDelay = totalDurationMs / 100;
    
    animationIntervalRef.current = setInterval(() => {
      if (progress < 100) {
        progress++;
        setCurrentProgress(progress);
        updateCarPosition(progress);
        if (onProgressUpdate) {
          onProgressUpdate(progress);
        }
        console.log(`🚚 Прогресс доставки: ${progress}%`);
      } else {
        clearInterval(animationIntervalRef.current);
        setIsAnimating(false);
        console.log('✅ Доставка завершена!');
      }
    }, stepDelay);
  };

  const resetAnimation = () => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setCurrentProgress(0);
    setIsAnimating(false);
    if (userLocation) {
      updateCarPosition(0);
    }
    console.log('🔄 Анимация сброшена');
  };

  if (locationError) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-red-500 text-sm">{locationError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!mapLoaded || !userLocation || !routeLoaded) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">
            {!userLocation ? 'Определение местоположения...' : 'Загрузка маршрута...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
        📍 Ваше текущее положение: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
      </div>
      
      <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden bg-gray-100" />
      
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Расстояние до ресторана:</span>
          <span className="font-bold text-emerald-600">{totalDistance} км</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-600">Расчетное время доставки:</span>
          <span className="font-bold text-emerald-600">30 мин</span>
        </div>
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>
        <div className="flex gap-3">
      <button
  onClick={startAnimation}
  disabled={isAnimating || waypoints.length === 0}
  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50"
>
  {isAnimating ? '🚚 Доставка началась...' : '🚚 Начать доставку'}
</button>
        </div>
      </div>
    </div>
  );
}