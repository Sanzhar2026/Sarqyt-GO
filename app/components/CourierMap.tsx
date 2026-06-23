// app/components/CourierMap.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ (зеленая линия)

'use client';

import { useEffect, useState, useRef } from 'react';

let L: any;

const loadLeaflet = async () => {
  if (typeof window === 'undefined') return;
  if (!L) {
    const leaflet = await import('leaflet');
    L = leaflet.default;
    await import('leaflet/dist/leaflet.css');
    
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '',
      iconUrl: '',
      shadowUrl: '',
    });
  }
  return L;
};

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYyMDU3ZGE4OTkxODQ2M2JhNmVlZDgzM2QzMDE2OTYwIiwiaCI6Im11cm11cjY0In0=';

const getRouteFromORS = async (startLat: number, startLon: number, endLat: number, endLon: number) => {
  try {
    console.log('🔄 ORS запрос...');
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        coordinates: [
          [startLon, startLat],
          [endLon, endLat]
        ]
      })
    });

    console.log('📡 ORS статус:', response.status);
    
    if (!response.ok) {
      console.error('❌ ORS ошибка:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('✅ ORS ответ получен');
    return data;
  } catch (error) {
    console.error('❌ ORS ошибка:', error);
    return null;
  }
};

const decodePolyline = (encoded: string) => {
  let index = 0, lat = 0, lng = 0;
  const coords = [];
  while (index < encoded.length) {
    let shift = 0, result = 0;
    let b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
};

const getStraightLineRoute = (startLat: number, startLon: number, endLat: number, endLon: number) => {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    points.push([
      startLat + (endLat - startLat) * t,
      startLon + (endLon - startLon) * t
    ]);
  }
  return points;
};

const LIGHT_MAP_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

interface CourierMapProps {
  restaurantLocation?: { lat: number; lon: number };
  customerLocation?: { lat: number; lon: number };
  height?: string;
  showRoute?: boolean;
  routeColor?: string;
  routeWidth?: number;
  courierLocation?: { lat: number; lon: number };
  orderId?: string | number;
}

export default function CourierMap({ 
  restaurantLocation, 
  customerLocation,
  height = "100%",
  showRoute = false,
  routeColor = "#367666",
  routeWidth = 4,
  courierLocation,
  orderId,
}: CourierMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [routeBuilt, setRouteBuilt] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 50.289, lon: 57.149 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      () => {
        setUserLocation({ lat: 50.289, lon: 57.149 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (restaurantLocation?.lat && restaurantLocation?.lon) {
      setMapCenter([restaurantLocation.lat, restaurantLocation.lon]);
    } else if (customerLocation?.lat && customerLocation?.lon) {
      setMapCenter([customerLocation.lat, customerLocation.lon]);
    } else if (userLocation?.lat && userLocation?.lon) {
      setMapCenter([userLocation.lat, userLocation.lon]);
    } else {
      setMapCenter([50.289, 57.149]);
    }
  }, [restaurantLocation, customerLocation, userLocation]);

  useEffect(() => {
    const initMap = async () => {
      await loadLeaflet();
      setMapLoaded(true);
    };
    initMap();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    if (!mapCenter) return;
    
    const [centerLat, centerLon] = mapCenter;
    
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false
    }).setView([centerLat, centerLon], 13);
    
    L.tileLayer(LIGHT_MAP_TILE, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(mapInstanceRef.current);
    
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapInstanceRef.current);
    
    console.log('🗺️ Карта инициализирована');
  }, [mapLoaded, mapCenter]);

  useEffect(() => {
    if (!mapInstanceRef.current || !showRoute) return;
    if (!restaurantLocation?.lat || !restaurantLocation?.lon || 
        !customerLocation?.lat || !customerLocation?.lon) return;
    if (routeBuilt) return;

    const buildRoute = async () => {
      try {
        console.log('🔄 Строим маршрут через ORS...');
        console.log('📍 Ресторан:', restaurantLocation);
        console.log('📍 Клиент:', customerLocation);
        
        const data = await getRouteFromORS(
          restaurantLocation.lat, restaurantLocation.lon,
          customerLocation.lat, customerLocation.lon
        );

        console.log('📦 ORS данные:', data);

        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }

        let points: any[] = [];

        if (data && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const geometry = route.geometry;
          const decodedPoints = decodePolyline(geometry);
          
          if (decodedPoints && decodedPoints.length > 0) {
            points = decodedPoints;
            console.log(`✅ ORS маршрут: ${points.length} точек`);
          }
        }
        
        // Если ORS не вернул маршрут - используем прямую линию
        if (points.length === 0) {
          console.log('⚠️ ORS не вернул маршрут, используем прямую линию');
          points = getStraightLineRoute(
            restaurantLocation.lat, restaurantLocation.lon,
            customerLocation.lat, customerLocation.lon
          );
        }

        // ✅ СОЗДАЕМ ЛИНИЮ С ПРИНУДИТЕЛЬНЫМ ЗЕЛЕНЫМ ЦВЕТОМ
        routeLayerRef.current = L.polyline(points, {
          color: '#367666',        // ЯВНО ЗЕЛЕНЫЙ
          weight: 4,
          opacity: 1,              // 100% непрозрачность
          lineCap: 'round',
          lineJoin: 'round',
          className: 'courier-route-line'  // добавляем класс для CSS
        }).addTo(mapInstanceRef.current);

        // ✅ ПРИНУДИТЕЛЬНО УСТАНАВЛИВАЕМ СТИЛЬ ЧЕРЕЗ DOM
        const routeElement = routeLayerRef.current._path;
        if (routeElement) {
          routeElement.style.stroke = '#367666';
          routeElement.style.strokeWidth = '4px';
          routeElement.style.opacity = '1';
        }

        setRouteBuilt(true);
        console.log('✅ Маршрут построен! Цвет:', '#367666');
        
        mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { 
          padding: [50, 50] 
        });
        
      } catch (error) {
        console.error('❌ Ошибка построения маршрута:', error);
      }
    };

    setTimeout(buildRoute, 500);
  }, [showRoute, restaurantLocation, customerLocation, mapLoaded, routeBuilt]);

  // Маркеры
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Ресторан
    if (restaurantLocation?.lat && restaurantLocation?.lon) {
      const icon = L.divIcon({
        html: `<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-white shadow-lg">🍽️</div>`,
        iconSize: [32, 32],
        className: 'custom-div-icon'
      });
      L.marker([restaurantLocation.lat, restaurantLocation.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Ресторан');
    }
    
    // Клиент
    if (customerLocation?.lat && customerLocation?.lon) {
      const icon = L.divIcon({
        html: `<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm border-2 border-white shadow-lg">🏠</div>`,
        iconSize: [32, 32],
        className: 'custom-div-icon'
      });
      L.marker([customerLocation.lat, customerLocation.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Клиент');
    }
    
    // Пользователь
    if (userLocation?.lat && userLocation?.lon) {
      const icon = L.divIcon({
        html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>`,
        iconSize: [16, 16],
        className: 'custom-div-icon'
      });
      L.marker([userLocation.lat, userLocation.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Вы здесь');
    }
  }, [restaurantLocation, customerLocation, userLocation, mapLoaded]);

  if (!mapLoaded || !mapCenter) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ height }}>
      {/* ✅ ДОБАВЛЯЕМ CSS ДЛЯ ПРИНУДИТЕЛЬНОГО ЗЕЛЕНОГО ЦВЕТА */}
      <style jsx>{`
        :global(.courier-route-line) {
          stroke: #367666 !important;
          stroke-width: 4px !important;
          opacity: 1 !important;
        }
        :global(.leaflet-interactive) {
          stroke: #367666 !important;
        }
      `}</style>
      
      {showRoute && !routeBuilt && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur rounded-lg shadow-lg px-4 py-2 text-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">Построение маршрута...</span>
          </div>
        </div>
      )}
      
      <button
        onClick={() => {
          if (userLocation && mapInstanceRef.current) {
            mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 15);
          }
        }}
        className="absolute bottom-4 right-4 z-10 bg-white/80 backdrop-blur rounded-full shadow-lg p-3 hover:bg-gray-100/80 transition-all border border-gray-200/50"
      >
        <svg className="w-6 h-6 text-blue-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      <div ref={mapRef} className="w-full h-full rounded-2xl" style={{ height: '100%' }} />
    </div>
  );
}