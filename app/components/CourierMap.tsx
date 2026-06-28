// app/components/CourierMap.tsx - ВСЕ РЕСТОРАНЫ В ГОРОДЕ

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

    if (!response.ok) {
      console.error('❌ ORS ошибка:', response.status);
      return null;
    }

    const data = await response.json();
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

interface Restaurant {
  id: number;
  lat: number;
  lon: number;
  name: string;
  address?: string;
}

interface CourierMapProps {
  restaurants?: Restaurant[];
  selectedRestaurantId?: number;
  customerLocation?: { lat: number; lon: number };
  height?: string;
  showRoute?: boolean;
  routeColor?: string;
  routeWidth?: number;
}

export default function CourierMap({ 
  restaurants = [],
  selectedRestaurantId,
  customerLocation,
  height = "100%",
  showRoute = false,
  routeColor = "#367666",
  routeWidth = 4,
}: CourierMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [routeBuilt, setRouteBuilt] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const restaurantMarkersRef = useRef<any[]>([]);

  // Получаем местоположение пользователя
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

  // Центр карты
  useEffect(() => {
    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    if (selectedRestaurant) {
      setMapCenter([selectedRestaurant.lat, selectedRestaurant.lon]);
    } else if (restaurants.length > 0) {
      setMapCenter([restaurants[0].lat, restaurants[0].lon]);
    } else if (customerLocation) {
      setMapCenter([customerLocation.lat, customerLocation.lon]);
    } else if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lon]);
    } else {
      setMapCenter([50.289, 57.149]);
    }
  }, [restaurants, selectedRestaurantId, customerLocation, userLocation]);

  // Инициализация карты
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
    }).setView([centerLat, centerLon], 14);
    
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

  // ✅ МАРКЕРЫ - ВСЕ РЕСТОРАНЫ
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Удаляем старые маркеры ресторанов
    restaurantMarkersRef.current.forEach(marker => marker.remove());
    restaurantMarkersRef.current = [];
    
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // ✅ ВСЕ РЕСТОРАНЫ
    restaurants.forEach((restaurant) => {
      const isSelected = restaurant.id === selectedRestaurantId;
      
      const icon = L.divIcon({
        html: `
          <div class="w-12 h-12 ${isSelected ? 'bg-red-600 scale-110' : 'bg-red-500'} rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer">
            🍽️
          </div>
        `,
        iconSize: [48, 48],
        className: 'custom-div-icon',
        iconAnchor: [24, 24]
      });
      
      const marker = L.marker([restaurant.lat, restaurant.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="font-bold text-sm">${restaurant.name}</div>
          ${restaurant.address ? `<div class="text-xs text-gray-500">${restaurant.address}</div>` : ''}
          ${isSelected ? '<div class="text-xs text-green-600 font-semibold">✓ Выбранный ресторан</div>' : ''}
        `, { 
          className: 'custom-popup',
          maxWidth: 250
        });
      
      restaurantMarkersRef.current.push(marker);
      
      // Если это выбранный ресторан - открываем попап
      if (isSelected) {
        setTimeout(() => marker.openPopup(), 500);
      }
    });
    
    // ✅ ПОЛЬЗОВАТЕЛЬ
    const locationToUse = customerLocation || userLocation;
    if (locationToUse?.lat && locationToUse?.lon) {
      const icon = L.divIcon({
        html: `
          <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v4a4 4 0 008 0V6a4 4 0 00-4-4zM5 12a7 7 0 0010 0H5z" clip-rule="evenodd"/>
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        className: 'custom-div-icon',
        iconAnchor: [20, 20]
      });
      
      userMarkerRef.current = L.marker([locationToUse.lat, locationToUse.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="font-bold text-sm">📍 Вы здесь</div>', { 
          className: 'custom-popup',
          maxWidth: 250
        });
    }
    
    console.log(`✅ Добавлено ${restaurantMarkersRef.current.length} ресторанов`);
    
  }, [restaurants, selectedRestaurantId, customerLocation, userLocation, mapLoaded]);

  // ✅ ПОСТРОЕНИЕ МАРШРУТА К ВЫБРАННОМУ РЕСТОРАНУ
  useEffect(() => {
    if (!mapInstanceRef.current || !showRoute) return;
    
    const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
    if (!selectedRestaurant) return;
    
    const targetLocation = customerLocation || userLocation;
    if (!targetLocation?.lat || !targetLocation?.lon) return;
    if (routeBuilt) return;

    const buildRoute = async () => {
      try {
        const data = await getRouteFromORS(
          selectedRestaurant.lat, selectedRestaurant.lon,
          targetLocation.lat, targetLocation.lon
        );

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
          }
        }
        
        if (points.length === 0) {
          points = getStraightLineRoute(
            selectedRestaurant.lat, selectedRestaurant.lon,
            targetLocation.lat, targetLocation.lon
          );
        }

        routeLayerRef.current = L.polyline(points, {
          color: routeColor || '#367666',
          weight: routeWidth || 4,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'courier-route-line'
        }).addTo(mapInstanceRef.current);

        const routeElement = routeLayerRef.current._path;
        if (routeElement) {
          routeElement.style.stroke = routeColor || '#367666';
          routeElement.style.strokeWidth = `${routeWidth || 4}px`;
          routeElement.style.opacity = '1';
        }

        setRouteBuilt(true);
        
        mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { 
          padding: [50, 50] 
        });
        
      } catch (error) {
        console.error('❌ Ошибка построения маршрута:', error);
      }
    };

    setTimeout(buildRoute, 500);
  }, [showRoute, restaurants, selectedRestaurantId, customerLocation, userLocation, mapLoaded, routeBuilt, routeColor, routeWidth]);

  // ✅ ПРЫЖОК К ВЫБРАННОМУ РЕСТОРАНУ
  const jumpToSelectedRestaurant = () => {
    const marker = restaurantMarkersRef.current.find(
      (_, index) => restaurants[index]?.id === selectedRestaurantId
    );
    if (marker && mapInstanceRef.current) {
      const latlng = marker.getLatLng();
      mapInstanceRef.current.setView([latlng.lat, latlng.lng], 17);
      marker.openPopup();
      marker._icon?.classList.add('animate-bounce');
      setTimeout(() => {
        marker._icon?.classList.remove('animate-bounce');
      }, 1000);
    }
  };

  // ✅ ПРЫЖОК К ПОЛЬЗОВАТЕЛЮ
  const jumpToUser = () => {
    if (userMarkerRef.current && mapInstanceRef.current) {
      const latlng = userMarkerRef.current.getLatLng();
      mapInstanceRef.current.setView([latlng.lat, latlng.lng], 17);
      userMarkerRef.current.openPopup();
    }
  };

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

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  return (
    <div className="relative w-full h-full" style={{ height }}>
      <style jsx>{`
        :global(.courier-route-line) {
          stroke: #367666 !important;
          stroke-width: 4px !important;
          opacity: 1 !important;
        }
        :global(.leaflet-interactive) {
          stroke: #367666 !important;
        }
        :global(.custom-div-icon) {
          background: transparent !important;
          border: none !important;
        }
        :global(.custom-popup .leaflet-popup-content-wrapper) {
          border-radius: 16px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
        }
        :global(.custom-popup .leaflet-popup-content) {
          font-size: 14px !important;
          padding: 10px 16px !important;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        :global(.animate-bounce) {
          animation: bounce 0.5s ease-in-out;
        }
        :global(.hover\\:scale-110:hover) {
          transform: scale(1.1);
        }
        :global(.transition-transform) {
          transition: transform 0.2s ease;
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
      
      {/* ✅ КНОПКА - ВЫБРАННЫЙ РЕСТОРАН */}
      {selectedRestaurant && (
        <button
          onClick={jumpToSelectedRestaurant}
          className="absolute bottom-20 right-4 z-10 bg-white/90 backdrop-blur rounded-full shadow-lg p-3 hover:bg-gray-100/90 transition-all border border-gray-200/50 flex items-center gap-2 text-sm font-medium text-gray-700 hover:scale-105 active:scale-95"
        >
          <span className="text-2xl">🍽️</span>
          <span className="hidden md:inline">{selectedRestaurant.name}</span>
        </button>
      )}
      
      {/* ✅ КНОПКА - МОЁ МЕСТОПОЛОЖЕНИЕ */}
      <button
        onClick={jumpToUser}
        className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur rounded-full shadow-lg p-3 hover:bg-gray-100/90 transition-all border border-gray-200/50 hover:scale-105 active:scale-95"
      >
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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