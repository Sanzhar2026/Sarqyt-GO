// app/components/CourierMap.tsx - БЕЗ МЕТКИ С РАССТОЯНИЕМ

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// Загружаем Leaflet динамически
let L: any;

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYyMDU3ZGE4OTkxODQ2M2JhNmVlZDgzM2QzMDE2OTYwIiwiaCI6Im11cm11cjY0In0=';

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

// Функция получения маршрута от ORS
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
        ],
        format: 'geojson',
        preference: 'fastest'
      })
    });

    if (!response.ok) {
      throw new Error(`ORS error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('ORS route error:', error);
    return null;
  }
};

// Функция декодирования polyline
const decodePolyline = (encoded: string) => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  let shift = 0;
  let result = 0;
  let byte = null;
  let latitude_change;
  let longitude_change;
  const factor = Math.pow(10, 5);

  while (index < encoded.length) {
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

    lat += latitude_change;
    lng += longitude_change;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dlat = (lat2 - lat1) * Math.PI / 180;
  const dlon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dlat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dlon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const LIGHT_MAP_TILE = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

interface CourierLocation {
  courier_id: number;
  first_name: string;
  last_name: string;
  lat: number;
  lon: number;
  status: string;
  timestamp: string;
  car_model?: string;
  car_number?: string;
  current_order_status?: string;
}

interface Supplier {
  id: number;
  business_name: string;
  lat: number;
  lon: number;
  address: string;
  distance_km: number;
  surprise_bags_count: number;
}

interface CourierMapProps {
  orderId?: number;
  restaurantLocation?: { lat: number; lon: number };
  customerLocation?: { lat: number; lon: number };
  showAllCouriers?: boolean;
  height?: string;
  showRoute?: boolean;
  routeColor?: string;
  routeWidth?: number;
  courierLocation?: { lat: number; lon: number };
}

export default function CourierMap({ 
  orderId, 
  restaurantLocation, 
  customerLocation,
  showAllCouriers = true,
  height = "100%",
  showRoute = false,
  routeColor = "#94a3b8",
  routeWidth = 3,
  courierLocation,
}: CourierMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [couriers, setCouriers] = useState<Map<number, CourierLocation>>(new Map());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const supplierMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  
  const API_URL = 'https://toogood-2ncf.onrender.com';

  // ============ ПОЛУЧЕНИЕ ГЕОЛОКАЦИИ ============
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается');
      setIsLoadingLocation(false);
      setUserLocation({ lat: 50.289, lon: 57.149 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLocation({ lat, lon });
        setLocationError(null);
        setIsLoadingLocation(false);
        console.log(`📍 Текущее положение: ${lat}, ${lon}`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Не удалось определить местоположение';
        if (error.code === 1) errorMsg = 'Доступ к геолокации запрещен';
        if (error.code === 2) errorMsg = 'Позиция недоступна';
        if (error.code === 3) errorMsg = 'Таймаут геолокации';
        
        setLocationError(errorMsg);
        setIsLoadingLocation(false);
        setUserLocation({ lat: 50.289, lon: 57.149 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Определяем центр карты
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

  // Загрузка карты
  useEffect(() => {
    const initMap = async () => {
      await loadLeaflet();
      setMapLoaded(true);
    };
    initMap();
  }, []);

  // Инициализация карты
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
    
    console.log(`🗺️ Карта инициализирована`);
  }, [mapLoaded, mapCenter]);

  // ============ ПОСТРОЕНИЕ МАРШРУТА ЧЕРЕЗ ORS ============
  useEffect(() => {
    if (!mapInstanceRef.current || !showRoute) return;
    if (!restaurantLocation?.lat || !restaurantLocation?.lon || 
        !customerLocation?.lat || !customerLocation?.lon) return;

    const fetchRoute = async () => {
      try {
        const data = await getRouteFromORS(
          restaurantLocation.lat, restaurantLocation.lon,
          customerLocation.lat, customerLocation.lon
        );

        // Удаляем старый маршрут
        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }

        if (data && data.features && data.features.length > 0) {
          const coordinates = data.features[0].geometry.coordinates;
          const points: [number, number][] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          
          setRoutePoints(points);

          // Рисуем маршрут по дорогам
          routeLayerRef.current = L.polyline(points, {
            color: routeColor,
            weight: routeWidth,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(mapInstanceRef.current);

          console.log(`✅ Маршрут построен`);
        } else {
          // Fallback - прямая линия если ORS не вернул маршрут
          const points: [number, number][] = [
            [restaurantLocation.lat, restaurantLocation.lon],
            [customerLocation.lat, customerLocation.lon]
          ];
          
          routeLayerRef.current = L.polyline(points, {
            color: routeColor,
            weight: routeWidth,
            opacity: 0.4,
            dashArray: '5, 5',
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(mapInstanceRef.current);
          
          console.log('⚠️ ORS не ответил, использована прямая линия');
        }
      } catch (error) {
        console.error('Ошибка построения маршрута:', error);
        // Fallback - прямая линия
        const points: [number, number][] = [
          [restaurantLocation.lat, restaurantLocation.lon],
          [customerLocation.lat, customerLocation.lon]
        ];
        
        routeLayerRef.current = L.polyline(points, {
          color: routeColor,
          weight: routeWidth,
          opacity: 0.4,
          dashArray: '5, 5',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapInstanceRef.current);
      }
    };

    fetchRoute();
  }, [showRoute, restaurantLocation, customerLocation, routeColor, routeWidth, mapLoaded]);

  // ============ ИКОНКИ (ПРОЗРАЧНЫЕ) ============
  
  const getCourierIcon = () => {
    return L.divIcon({
      html: `<div class="relative">
               <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-2 border-white/50" style="background-color: rgba(156, 163, 175, 0.6); backdrop-filter: blur(4px);">
                 🚚
               </div>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    });
  };

  const getSupplierIcon = () => {
    return L.divIcon({
      html: `<div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-2 border-white/50" style="background-color: rgba(156, 163, 175, 0.6); backdrop-filter: blur(4px);">
               🏪
             </div>`,
      iconSize: [40, 40],
      className: 'custom-div-icon',
      popupAnchor: [0, -20]
    });
  };

  const getUserLocationIcon = () => {
    return L.divIcon({
      html: `<div class="relative">
               <div class="w-5 h-5 rounded-full shadow-lg" style="background-color: rgba(59, 130, 246, 0.5); border: 2px solid rgba(255,255,255,0.5);"></div>
               <div class="absolute -top-1 -left-1 w-7 h-7 rounded-full opacity-30 animate-ping" style="background-color: rgba(59, 130, 246, 0.3);"></div>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [20, 20]
    });
  };

  const getRestaurantIcon = () => {
    return L.divIcon({
      html: `<div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-2 border-white/50" style="background-color: rgba(239, 68, 68, 0.6); backdrop-filter: blur(4px);">
               🍽️
             </div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    });
  };

  const getCustomerIcon = () => {
    return L.divIcon({
      html: `<div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-2 border-white/50" style="background-color: rgba(16, 185, 129, 0.6); backdrop-filter: blur(4px);">
               🏠
             </div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    });
  };

  // ============ ЗАГРУЗКА МАГАЗИНОВ ============
  
  const fetchNearbySuppliers = async () => {
    const lat = userLocation?.lat || 50.289;
    const lon = userLocation?.lon || 57.149;
    
    try {
      const response = await fetch(`${API_URL}/api/suppliers`, {
        credentials: 'include'
      });
      const allSuppliers = await response.json();
      
      const bagsResponse = await fetch(`${API_URL}/api/surprise-bags`, {
        credentials: 'include'
      });
      const allBags = await bagsResponse.json();
      
      const suppliersWithBags = new Set();
      allBags.forEach((bag: any) => {
        if (bag.available_quantity > 0 && bag.is_active) {
          suppliersWithBags.add(bag.supplier_id);
        }
      });
      
      const validSuppliers = allSuppliers
        .filter((s: any) => suppliersWithBags.has(s.id) && s.lat && s.lon && s.is_active === true)
        .map((s: any) => ({
          id: s.id,
          business_name: s.business_name,
          lat: s.lat,
          lon: s.lon,
          address: s.address || 'Адрес не указан',
          distance_km: haversineDistance(lat, lon, s.lat, s.lon),
          surprise_bags_count: 1
        }));
      
      console.log(`🏪 НАЙДЕНО МАГАЗИНОВ: ${validSuppliers.length}`);
      setSuppliers(validSuppliers);
      
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    if (mapLoaded && !isLoadingLocation) {
      fetchNearbySuppliers();
    }
  }, [mapLoaded, isLoadingLocation, userLocation]);

  const addSupplierMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    supplierMarkersRef.current.forEach(marker => marker.remove());
    supplierMarkersRef.current = [];
    
    suppliers.forEach(supplier => {
      if (!supplier.lat || !supplier.lon) return;
      
      const icon = getSupplierIcon();
      const marker = L.marker([supplier.lat, supplier.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center min-w-[180px] bg-white rounded-xl p-3 shadow-lg border border-gray-200">
            <div class="font-bold text-lg text-gray-800">${supplier.business_name}</div>
            <div class="text-sm text-gray-500">${supplier.address || 'Адрес не указан'}</div>
            <div class="flex justify-center gap-2 mt-2 text-sm">
              <span class="text-orange-500">📦 ${supplier.surprise_bags_count} сюрпризов</span>
              <span class="text-gray-500">📍 ${supplier.distance_km.toFixed(2)} км</span>
            </div>
            <button class="mt-2 bg-orange-500 text-white px-3 py-1 rounded-lg text-xs view-offers-btn hover:bg-orange-600" data-id="${supplier.id}">
              Смотреть сюрпризы
            </button>
          </div>
        `);
      
      supplierMarkersRef.current.push(marker);
    });
    
    setTimeout(() => {
      document.querySelectorAll('.view-offers-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = (e.target as HTMLElement).dataset.id;
          if (id) {
            window.location.href = `/offers/${id}`;
          }
        });
      });
    }, 100);
  }, [suppliers]);

  useEffect(() => {
    if (mapInstanceRef.current && suppliers.length > 0) {
      addSupplierMarkers();
    }
  }, [mapInstanceRef.current, suppliers, addSupplierMarkers]);

  // ============ МАРКЕРЫ ============
  
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    
    const icon = getUserLocationIcon();
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon })
      .addTo(mapInstanceRef.current)
      .bindPopup('<div class="text-center bg-white p-2 rounded-lg shadow"><strong class="text-blue-500">Вы здесь</strong><br/><span class="text-gray-500">Ваше текущее положение</span></div>');
    
  }, [userLocation, mapInstanceRef.current]);

  // Добавление ресторана и клиента
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (restaurantLocation?.lat && restaurantLocation?.lon) {
      L.marker([restaurantLocation.lat, restaurantLocation.lon], { icon: getRestaurantIcon() })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="text-center bg-white p-2 rounded-lg shadow border border-gray-200">Ресторан</div>');
    }
    
    if (customerLocation?.lat && customerLocation?.lon) {
      L.marker([customerLocation.lat, customerLocation.lon], { icon: getCustomerIcon() })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="text-center bg-white p-2 rounded-lg shadow border border-gray-200">Клиент</div>');
    }
  }, [restaurantLocation, customerLocation, mapLoaded]);

  // WebSocket для курьеров
  useEffect(() => {
    if (!mapLoaded) return;
    
    const wsUrl = `${API_URL.replace('https', 'wss')}/ws/courier-tracking`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('✅ Map WebSocket connected');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'courier_location') {
          setCouriers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.courier_id, {
              courier_id: data.courier_id,
              first_name: data.first_name || 'Курьер',
              last_name: data.last_name || '',
              lat: data.lat,
              lon: data.lon,
              status: data.status,
              timestamp: data.timestamp,
              car_model: data.car_model,
              car_number: data.car_number,
              current_order_status: data.current_order_status
            });
            return newMap;
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 Map WebSocket disconnected');
      setWsConnected(false);
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          const newWs = new WebSocket(wsUrl);
          wsRef.current = newWs;
        }
      }, 3000);
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [mapLoaded, API_URL]);

  // Загрузка начальных позиций курьеров
  useEffect(() => {
    const fetchInitialCouriers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/couriers/online`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.couriers) {
          const newMap = new Map();
          data.couriers.forEach((courier: any) => {
            newMap.set(courier.id, {
              courier_id: courier.id,
              first_name: courier.first_name,
              last_name: courier.last_name,
              lat: courier.current_lat,
              lon: courier.current_lon,
              status: courier.current_order_status || 'online',
              timestamp: new Date().toISOString(),
              car_model: courier.car_model,
              car_number: courier.car_number,
              current_order_status: courier.current_order_status
            });
          });
          setCouriers(newMap);
        }
      } catch (error) {
        console.error('Error fetching couriers:', error);
      }
    };
    
    if (mapLoaded) {
      fetchInitialCouriers();
      const interval = setInterval(fetchInitialCouriers, 30000);
      return () => clearInterval(interval);
    }
  }, [mapLoaded, API_URL]);

  // Центрирование карты
  useEffect(() => {
    const handleCenterMap = (event: CustomEvent) => {
      const { lat, lon, zoom } = event.detail;
      
      if (mapInstanceRef.current && lat && lon) {
        const targetZoom = zoom || 17;
        mapInstanceRef.current.setView([lat, lon], targetZoom);
      }
    };
    
    window.addEventListener('centerMap', handleCenterMap as EventListener);
    return () => {
      window.removeEventListener('centerMap', handleCenterMap as EventListener);
    };
  }, [mapInstanceRef.current]);

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
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur rounded-lg shadow-lg px-3 py-1 text-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400/50'}`}></div>
          <span className="text-xs text-gray-500">{wsConnected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>
      
      {locationError && (
        <div className="absolute top-4 left-4 z-10 bg-yellow-50/80 backdrop-blur rounded-lg shadow-lg px-3 py-1 text-xs text-yellow-600 border border-yellow-200">
          {locationError}
        </div>
      )}
      
      <button
        onClick={() => {
          if (userLocation && mapInstanceRef.current) {
            mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 15);
          }
        }}
        className="absolute bottom-4 right-4 z-10 bg-white/80 backdrop-blur rounded-full shadow-lg p-3 hover:bg-gray-100/80 transition-all border border-gray-200/50"
        title="Мое местоположение"
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