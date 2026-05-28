// app/components/CourierMap.tsx - магазины в радиусе 50 км
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// Загружаем Leaflet динамически
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
}

export default function CourierMap({ 
  orderId, 
  restaurantLocation, 
  customerLocation,
  showAllCouriers = true,
  height = "100%"
}: CourierMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [couriers, setCouriers] = useState<Map<number, CourierLocation>>(new Map());
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const supplierMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  
  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Получаем реальное местоположение пользователя
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLocation({ lat, lon });
        console.log(`📍 Текущее положение: ${lat}, ${lon}`);
      },
      (error) => console.error('Geolocation error:', error),
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
      // Центр Актобе по умолчанию
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
    
    mapInstanceRef.current = L.map(mapRef.current).setView([centerLat, centerLon], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(mapInstanceRef.current);
    
    L.control.zoom({ position: 'topright' }).addTo(mapInstanceRef.current);
    
    console.log(`🗺️ Карта инициализирована`);
  }, [mapLoaded, mapCenter]);

  // ============ ИКОНКИ ============
  
  const getCourierIcon = (status?: string) => {
    const color = status === 'almost_done' ? '#eab308' : 
                  status === 'delivering' ? '#3b82f6' : 
                  status === 'assigned' ? '#8b5cf6' : '#10b981';
    
    return L.divIcon({
      html: `<div class="relative">
               <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-lg" style="background-color: ${color}">
                 🚚
               </div>
               <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full" style="background-color: ${color}"></div>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    });
  };

  const getSupplierIcon = () => {
    return L.divIcon({
      html: `<div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-2 border-white">🏪</div>`,
      iconSize: [40, 40],
      className: 'custom-div-icon',
      popupAnchor: [0, -20]
    });
  };

  const getUserLocationIcon = () => {
    return L.divIcon({
      html: `<div class="relative">
               <div class="w-5 h-5 bg-blue-500 rounded-full shadow-lg animate-pulse" style="border: 2px solid white;"></div>
               <div class="absolute -top-1 -left-1 w-7 h-7 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [20, 20]
    });
  };

  const getRestaurantIcon = () => {
    return L.divIcon({
      html: `<div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg">🍽️</div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    });
  };

  const getCustomerIcon = () => {
    return L.divIcon({
      html: `<div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg">🏠</div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
    });
  };

  // ============ ЗАГРУЗКА МАГАЗИНОВ В РАДИУСЕ 50 КМ ============
  
  const fetchNearbySuppliers = async () => {
    // Используем геолокацию пользователя или координаты по умолчанию
    const lat = userLocation?.lat || 50.289;
    const lon = userLocation?.lon || 57.149;
    
    try {
      // ✅ РАДИУС 50 КМ
      const response = await fetch(`${API_URL}/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=50`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.suppliers && data.suppliers.length > 0) {
        setSuppliers(data.suppliers);
        console.log(`🏪 Загружено ${data.suppliers.length} магазинов в радиусе 50 км`);
      } else {
        console.log('🏪 Нет магазинов в радиусе 50 км');
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  // Загружаем магазины при изменении местоположения или при загрузке карты
  useEffect(() => {
    if (mapLoaded) {
      fetchNearbySuppliers();
    }
  }, [mapLoaded, userLocation]);

  // Добавление маркеров магазинов на карту
  const addSupplierMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    // Очищаем старые маркеры
    supplierMarkersRef.current.forEach(marker => marker.remove());
    supplierMarkersRef.current = [];
    
    suppliers.forEach(supplier => {
      if (!supplier.lat || !supplier.lon) return;
      
      const icon = getSupplierIcon();
      const marker = L.marker([supplier.lat, supplier.lon], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div class="text-center min-w-[180px]">
            <div class="font-bold text-lg">${supplier.business_name}</div>
            <div class="text-sm text-gray-600">${supplier.address || 'Адрес не указан'}</div>
            <div class="flex justify-center gap-2 mt-2 text-sm">
              <span>📦 ${supplier.surprise_bags_count} сюрпризов</span>
              <span>📍 ${supplier.distance_km} км</span>
            </div>
            <button class="mt-2 bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs view-offers-btn" data-id="${supplier.id}">
              Смотреть сюрпризы
            </button>
          </div>
        `);
      
      supplierMarkersRef.current.push(marker);
    });
    
    // Обработчик кликов на кнопки в попапах
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
    
    // Масштабируем карту, чтобы показать все маркеры, если их много
    if (supplierMarkersRef.current.length > 0 && mapInstanceRef.current) {
      const bounds = L.latLngBounds(supplierMarkersRef.current.map(m => m.getLatLng()));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [suppliers]);

  // Добавляем маркеры магазинов на карту
  useEffect(() => {
    if (mapInstanceRef.current && suppliers.length > 0) {
      addSupplierMarkers();
    }
  }, [mapInstanceRef.current, suppliers, addSupplierMarkers]);

  // ============ МАРКЕРЫ КУРЬЕРОВ И ПОЛЬЗОВАТЕЛЯ ============
  
  // Добавляем маркер текущего положения пользователя
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    
    const icon = getUserLocationIcon();
    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon })
      .addTo(mapInstanceRef.current)
      .bindPopup('<div class="text-center"><strong>📍 Вы здесь</strong><br/>Ваше текущее положение</div>');
    
  }, [userLocation, mapInstanceRef.current]);

  // Обновление маркеров курьеров
  const updateCourierMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    couriers.forEach((courier, id) => {
      if (!courier.lat || !courier.lon) return;
      
      const existingMarker = markersRef.current.get(id);
      const icon = getCourierIcon(courier.current_order_status);
      
      if (existingMarker) {
        existingMarker.setLatLng([courier.lat, courier.lon]);
        existingMarker.bindPopup(createPopupContent(courier));
      } else {
        const marker = L.marker([courier.lat, courier.lon], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(createPopupContent(courier));
        
        markersRef.current.set(id, marker);
      }
    });
    
    markersRef.current.forEach((marker, id) => {
      if (!couriers.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [couriers]);

  const createPopupContent = (courier: CourierLocation) => {
    const div = document.createElement('div');
    div.className = 'min-w-[200px]';
    div.innerHTML = `
      <div class="flex items-center gap-3 mb-3">
        <div class="text-3xl">🚚</div>
        <div>
          <p class="font-semibold">${courier.first_name} ${courier.last_name}</p>
          <p class="text-xs text-gray-500">Курьер</p>
        </div>
      </div>
      <div class="space-y-2 text-sm border-t pt-2">
        <div class="flex justify-between">
          <span class="text-gray-500">Статус:</span>
          <span class="font-medium">
            ${courier.current_order_status === 'almost_done' ? '🔔 Почти закончил' :
              courier.current_order_status === 'delivering' ? '🚚 В пути' :
              courier.current_order_status === 'assigned' ? '📦 Назначен' :
              '✅ На линии'}
          </span>
        </div>
        ${courier.car_model ? `
        <div class="flex justify-between">
          <span class="text-gray-500">Авто:</span>
          <span>${courier.car_model}</span>
        </div>` : ''}
        <div class="flex justify-between">
          <span class="text-gray-500">Обновлен:</span>
          <span class="text-xs">${new Date(courier.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
      <button class="mt-3 w-full bg-blue-500 text-white text-sm py-2 rounded-lg center-btn" data-id="${courier.courier_id}">
        📍 Центрировать
      </button>
    `;
    
    setTimeout(() => {
      const btn = div.querySelector('.center-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([courier.lat, courier.lon], 15);
            setSelectedCourier(courier.courier_id);
          }
        });
      }
    }, 0);
    
    return div;
  };

  // Добавление ресторана и клиента
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (restaurantLocation) {
      L.marker([restaurantLocation.lat, restaurantLocation.lon], { icon: getRestaurantIcon() })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="text-center">🍽️ Ресторан</div>');
    }
    
    if (customerLocation) {
      L.marker([customerLocation.lat, customerLocation.lon], { icon: getCustomerIcon() })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="text-center">🏠 Клиент</div>');
    }
  }, [restaurantLocation, customerLocation, mapLoaded]);

  // Обновление маркеров курьеров
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateCourierMarkers();
    }
  }, [couriers, updateCourierMarkers]);

  // Слушаем событие центрирования карты
  useEffect(() => {
    const handleCenterMap = (event: CustomEvent) => {
      const { lat, lon, zoom } = event.detail;
      console.log(`🎯 Центрирование: lat=${lat}, lon=${lon}, zoom=${zoom || 17}`);
      
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

  if (!mapLoaded || !mapCenter) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ height }}>
      {/* Индикатор WebSocket */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg px-3 py-1 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs">{wsConnected ? 'Live' : 'Connecting...'}</span>
        </div>
      </div>
      
      {/* Контейнер карты */}
      <div ref={mapRef} className="w-full h-full rounded-2xl" style={{ height: '100%' }} />
    </div>
  );
}