// app/components/CourierMap.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// Загружаем Leaflet динамически (без SSR)
let L: any;
let MapContainer: any;
let TileLayer: any;
let Marker: any;
let Popup: any;
let Polyline: any;

// Динамический импорт
const loadLeaflet = async () => {
  if (typeof window === 'undefined') return;
  if (!L) {
    const leaflet = await import('leaflet');
    L = leaflet.default;
    await import('leaflet/dist/leaflet.css');
    
    // Fix для иконок Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
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
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  
  const API_URL = 'https://toogood-2ncf.onrender.com';

  // ✅ 1. Получаем реальное местоположение пользователя
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
        console.log(`📍 Текущее положение пользователя: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
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

  // ✅ 2. Определяем центр карты на основе доступных данных
  useEffect(() => {
    // Приоритет: ресторан > клиент > пользователь
    if (restaurantLocation?.lat && restaurantLocation?.lon) {
      setMapCenter([restaurantLocation.lat, restaurantLocation.lon]);
      console.log(`🎯 Центр карты: Ресторан (${restaurantLocation.lat}, ${restaurantLocation.lon})`);
    } else if (customerLocation?.lat && customerLocation?.lon) {
      setMapCenter([customerLocation.lat, customerLocation.lon]);
      console.log(`🎯 Центр карты: Клиент (${customerLocation.lat}, ${customerLocation.lon})`);
    } else if (userLocation?.lat && userLocation?.lon) {
      setMapCenter([userLocation.lat, userLocation.lon]);
      console.log(`🎯 Центр карты: Пользователь (${userLocation.lat}, ${userLocation.lon})`);
    } else {
      console.warn('⚠️ Нет координат для отображения карты');
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

  // Инициализация карты после загрузки
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
    
    console.log(`🗺️ Карта инициализирована с центром: ${centerLat}, ${centerLon}`);
  }, [mapLoaded, mapCenter]);

  // Создание иконок
  const getCourierIcon = (status?: string) => {
    const color = status === 'almost_done' ? '#eab308' : 
                  status === 'delivering' ? '#3b82f6' : 
                  status === 'assigned' ? '#8b5cf6' : '#10b981';
    
    return L.divIcon({
      html: `<div class="relative">
               <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl shadow-lg animate-pulse" style="background-color: ${color}">
                 🚚
               </div>
               <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full" style="background-color: ${color}"></div>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      popupAnchor: [0, -20]
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

  // Анимация движения курьера
  const animateCourierMovement = (marker: any, newLat: number, newLon: number, oldLat: number, oldLon: number) => {
    if (!marker || !mapInstanceRef.current) return;
    
    const startPoint = L.latLng(oldLat, oldLon);
    const endPoint = L.latLng(newLat, newLon);
    const duration = 2000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * progress;
      const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * progress;
      
      marker.setLatLng([lat, lng]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Обновление маркеров на карте
  const updateCourierMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    couriers.forEach((courier, id) => {
      if (!courier.lat || !courier.lon) return;
      
      const existingMarker = markersRef.current.get(id);
      const icon = getCourierIcon(courier.current_order_status);
      
      if (existingMarker) {
        const oldLatLng = existingMarker.getLatLng();
        const oldLat = oldLatLng.lat;
        const oldLon = oldLatLng.lng;
        
        if (Math.abs(oldLat - courier.lat) > 0.0001 || Math.abs(oldLon - courier.lon) > 0.0001) {
          animateCourierMovement(existingMarker, courier.lat, courier.lon, oldLat, oldLon);
        }
        
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

  // Добавление ресторана и клиента на карту
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (restaurantLocation) {
      L.marker([restaurantLocation.lat, restaurantLocation.lon], { icon: getRestaurantIcon() })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="text-center"><div class="text-2xl">🍽️</div><p class="font-semibold">Ресторан</p><p class="text-xs">Точка выдачи</p></div>');
    }
  }, [restaurantLocation, mapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    if (customerLocation) {
      L.marker([customerLocation.lat, customerLocation.lon], { icon: getCustomerIcon() })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="text-center"><div class="text-2xl">🏠</div><p class="font-semibold">Клиент</p><p class="text-xs">Точка доставки</p></div>');
    }
  }, [customerLocation, mapLoaded]);

  // Обновление маркеров при изменении списка курьеров
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateCourierMarkers();
    }
  }, [couriers, updateCourierMarkers]);

  // WebSocket для реального времени
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
            
            if (selectedCourier === data.courier_id && mapInstanceRef.current) {
              mapInstanceRef.current.setView([data.lat, data.lon], 15);
            }
            
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
  }, [mapLoaded, selectedCourier, API_URL]);

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

  const fitBoundsToCouriers = () => {
    if (!mapInstanceRef.current || couriers.size === 0) return;
    
    const bounds = L.latLngBounds();
    
    couriers.forEach((courier) => {
      if (courier.lat && courier.lon) {
        bounds.extend([courier.lat, courier.lon]);
      }
    });
    
    if (restaurantLocation) {
      bounds.extend([restaurantLocation.lat, restaurantLocation.lon]);
    }
    
    if (customerLocation) {
      bounds.extend([customerLocation.lat, customerLocation.lon]);
    }
    
    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lon]);
    }
    
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const centerToMyLocation = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 14);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14);
      });
    } else {
      alert('Геолокация недоступна');
    }
  };

  // Показываем ошибку или загрузку
  if (locationError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center" style={{ height }}>
        <div className="text-center p-4">
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

  if (!mapLoaded || !mapCenter) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">
            {!mapCenter ? 'Определение местоположения...' : 'Загрузка карты...'}
          </p>
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
      
      {/* Кнопки управления */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={fitBoundsToCouriers}
          className="bg-white rounded-full shadow-lg p-3 hover:bg-gray-100 transition"
          title="Показать всех курьеров"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7 17H3v2h4v-2z" />
          </svg>
        </button>
        
        <button
          onClick={centerToMyLocation}
          className="bg-white rounded-full shadow-lg p-3 hover:bg-gray-100 transition"
          title="Мое местоположение"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      
      {/* Список курьеров */}
      {showAllCouriers && couriers.size > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg max-w-[250px] max-h-[300px] overflow-y-auto">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm">Курьеры на линии ({couriers.size})</h3>
          </div>
          <div className="divide-y max-h-[250px] overflow-y-auto">
            {Array.from(couriers.values()).map((courier) => (
              <button
                key={courier.courier_id}
                onClick={() => {
                  if (mapInstanceRef.current && courier.lat && courier.lon) {
                    mapInstanceRef.current.setView([courier.lat, courier.lon], 15);
                    setSelectedCourier(courier.courier_id);
                  }
                }}
                className={`w-full text-left p-3 hover:bg-gray-50 transition ${
                  selectedCourier === courier.courier_id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="text-2xl">🚚</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {courier.first_name} {courier.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {courier.current_order_status === 'almost_done' && '🔔 Почти закончил'}
                      {courier.current_order_status === 'delivering' && '🚚 В пути'}
                      {courier.current_order_status === 'assigned' && '📦 Назначен'}
                      {!courier.current_order_status && '✅ На линии'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}