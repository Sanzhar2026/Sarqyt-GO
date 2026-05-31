'use client';

import { useEffect, useState, useRef } from 'react';

interface CourierLocation {
  lat: number;
  lon: number;
  timestamp: string;
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
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Загрузка Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;
      
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
      document.head.appendChild(script);
    };
    
    loadLeaflet();
  }, []);

  // Загрузка маршрута
  useEffect(() => {
    if (!mapLoaded) return;
    
    const fetchRoute = async () => {
      try {
        console.log('🔄 Загрузка маршрута...');
        const response = await fetch(`${API_URL}/api/delivery/route/${orderId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            start_lat: startLat,
            start_lon: startLon,
            end_lat: endLat,
            end_lon: endLon
          })
        });
        
        const data = await response.json();
        if (data.success && data.waypoints) {
          setWaypoints(data.waypoints);
          setTotalDistance(data.distance_km);
          initMap(data);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }
    };
    
    fetchRoute();
  }, [mapLoaded, startLat, startLon, endLat, endLon, orderId]);

  // WebSocket для получения реальных координат курьера
  useEffect(() => {
    if (!mapLoaded) return;
    
    const token = sessionStorage.getItem('courierToken');
    if (!token) {
      console.log('❌ Нет токена курьера');
      return;
    }
    
    const ws = new WebSocket(`${API_URL.replace('https', 'wss')}/ws/courier-tracking?token=${token}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('✅ WebSocket для отслеживания курьера подключен');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Получаем реальные координаты курьера
        if (data.type === 'courier_location') {
          console.log(`📍 Реальная позиция курьера: ${data.lat}, ${data.lon}`);
          setCourierLocation({
            lat: data.lat,
            lon: data.lon,
            timestamp: data.timestamp
          });
          
          // Обновляем маркер на карте
          if (driverMarkerRef.current && mapInstanceRef.current) {
            driverMarkerRef.current.setLatLng([data.lat, data.lon]);
            
            // Центрируем карту на курьере
            mapInstanceRef.current.setView([data.lat, data.lon], 14);
          }
          
          // Рассчитываем прогресс
          if (waypoints.length > 0 && onProgressUpdate) {
            let minDist = Infinity;
            let bestProgress = 0;
            
            waypoints.forEach((wp, idx) => {
              const dist = Math.hypot(data.lat - wp.lat, data.lon - wp.lon);
              if (dist < minDist) {
                minDist = dist;
                bestProgress = (idx / waypoints.length) * 100;
              }
            });
            
            onProgressUpdate(Math.round(bestProgress));
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket отключен');
      setWsConnected(false);
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          wsRef.current = new WebSocket(`${API_URL.replace('https', 'wss')}/ws/courier-tracking?token=${token}`);
        }
      }, 3000);
    };
    
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [mapLoaded, API_URL, waypoints]);

  const initMap = (routeData: any) => {
    if (!window.L || mapInstanceRef.current) return;
    if (!mapRef.current) return;
    
    mapInstanceRef.current = window.L.map(mapRef.current).setView([startLat, startLon], 13);
    
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstanceRef.current);
    
    // Маркер ресторана
    const restaurantIcon = window.L.divIcon({
      html: '<div style="background:#dc2626; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid white;">🏪</div>',
      iconSize: [40, 40]
    });
    window.L.marker([endLat, endLon], { icon: restaurantIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`🏪 ${supplierName}`);
    
    // Маркер клиента
    const customerIcon = window.L.divIcon({
      html: '<div style="background:#22c55e; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid white;">🏠</div>',
      iconSize: [40, 40]
    });
    window.L.marker([startLat, startLon], { icon: customerIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`📍 Клиент: ${customerAddress}`);
    
    // Маршрут
    if (routeData.waypoints && routeData.waypoints.length > 0) {
      const latlngs = routeData.waypoints.map((p: any) => [p.lat, p.lon]);
      routePolylineRef.current = window.L.polyline(latlngs, { 
        color: '#fbbf24', 
        weight: 5, 
        dashArray: '8,8' 
      }).addTo(mapInstanceRef.current);
      
      mapInstanceRef.current.fitBounds(latlngs, { padding: [50, 50] });
    }
    
    // Машина курьера (начальная позиция)
    const carIcon = window.L.divIcon({
      html: '<div style="background:#3b82f6; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; border:3px solid white; box-shadow:0 2px 10px rgba(59,130,246,0.4);">🚚</div>',
      iconSize: [45, 45]
    });
    driverMarkerRef.current = window.L.marker([startLat, startLon], { icon: carIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('🚚 Курьер');
    
    console.log('✅ Карта инициализирована');
  };

  // Обновление позиции маркера при получении новых координат
  useEffect(() => {
    if (!driverMarkerRef.current || !courierLocation) return;
    driverMarkerRef.current.setLatLng([courierLocation.lat, courierLocation.lon]);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([courierLocation.lat, courierLocation.lon], 14);
    }
  }, [courierLocation]);

  if (!mapLoaded) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 flex justify-between">
        <span>🚚 Реальное время: {wsConnected ? '🟢' : '🔴'}</span>
        <span>📏 Расстояние: {totalDistance} км</span>
      </div>
      
      <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden bg-gray-100" />
      
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Статус доставки:</span>
          <span className={`font-bold ${wsConnected ? 'text-emerald-600' : 'text-gray-500'}`}>
            {wsConnected ? '🟢 Отслеживание в реальном времени' : '⏳ Ожидание курьера'}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          Позиция курьера обновляется автоматически
        </div>
      </div>
    </div>
  );
}