'use client';

import { useEffect, useState, useRef } from 'react';

interface DeliveryMapWithRouteProps {
  orderId: number;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  supplierName: string;
  customerAddress: string;
  onProgressUpdate?: (progress: number) => void;
  courierLocation?: { lat: number; lon: number } | null;
}

export default function DeliveryMapWithRoute({
  orderId,
  startLat,
  startLon,
  endLat,
  endLon,
  supplierName,
  customerAddress,
  onProgressUpdate,
  courierLocation
}: DeliveryMapWithRouteProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  // Загрузка Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;
      
      if (!startLat || !startLon || !endLat || !endLon) {
        console.log('⚠️ Нет координат для маршрута');
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
      document.head.appendChild(script);
    };
    
    loadLeaflet();
  }, []);

  // Загрузка маршрута
  useEffect(() => {
    if (!mapLoaded) return;
    if (!startLat || !startLon || !endLat || !endLon) return;
    
    const fetchRoute = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('courierToken');
        
        console.log('🔄 Загрузка маршрута:', { startLat, startLon, endLat, endLon });
        
        const response = await fetch(`https://toogood-2ncf.onrender.com/api/delivery/route/${orderId}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            start_lat: startLat,
            start_lon: startLon,
            end_lat: endLat,
            end_lon: endLon
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.waypoints && data.waypoints.length > 0) {
          setWaypoints(data.waypoints);
          setTotalDistance(data.distance_km);
          initMap(data);
        } else {
          const straightLine = generateStraightLine(startLat, startLon, endLat, endLon);
          setWaypoints(straightLine);
          const distance = calculateDistance(startLat, startLon, endLat, endLon);
          setTotalDistance(distance);
          initMap({ waypoints: straightLine, distance_km: distance });
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        const straightLine = generateStraightLine(startLat, startLon, endLat, endLon);
        setWaypoints(straightLine);
        const distance = calculateDistance(startLat, startLon, endLat, endLon);
        setTotalDistance(distance);
        initMap({ waypoints: straightLine, distance_km: distance });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoute();
  }, [mapLoaded, startLat, startLon, endLat, endLon, orderId]);

  // Обновление позиции курьера на карте
  useEffect(() => {
    if (!driverMarkerRef.current || !courierLocation) return;
    driverMarkerRef.current.setLatLng([courierLocation.lat, courierLocation.lon]);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([courierLocation.lat, courierLocation.lon], 14);
    }
    
    if (waypoints.length > 0 && onProgressUpdate) {
      let minDist = Infinity;
      let bestProgress = 0;
      
      waypoints.forEach((wp, idx) => {
        const dist = Math.hypot(courierLocation.lat - wp.lat, courierLocation.lon - wp.lon);
        if (dist < minDist) {
          minDist = dist;
          bestProgress = (idx / waypoints.length) * 100;
        }
      });
      
      onProgressUpdate(Math.round(bestProgress));
    }
  }, [courierLocation, waypoints, onProgressUpdate]);

  const generateStraightLine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const waypoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      waypoints.push({
        lat: lat1 + (lat2 - lat1) * t,
        lon: lon1 + (lon2 - lon1) * t
      });
    }
    return waypoints;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dlat = (lat2 - lat1) * Math.PI / 180;
    const dlon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dlat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dlon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const initMap = (routeData: any) => {
    if (!window.L || mapInstanceRef.current) return;
    if (!mapRef.current) return;
    
    const centerLat = (startLat + endLat) / 2;
    const centerLon = (startLon + endLon) / 2;
    
    mapInstanceRef.current = window.L.map(mapRef.current).setView([centerLat, centerLon], 13);
    
    // ✅ Используем светлый стиль CartoDB Light (как на скриншоте)
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 3
    }).addTo(mapInstanceRef.current);
    
    // ✅ Маркер ресторана (в брендовом цвете #367666)
    const restaurantIcon = window.L.divIcon({
      html: '<div style="background:#367666; width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid white; box-shadow:0 2px 10px rgba(54,118,102,0.3);">🏪</div>',
      iconSize: [42, 42],
      className: 'custom-marker'
    });
    window.L.marker([endLat, endLon], { icon: restaurantIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>🏪 ${supplierName}</b><br>📍 Ресторан`);
    
    // ✅ Маркер старта/клиента
    const isRestaurantRoute = customerAddress === 'Ресторан';
    const startIcon = window.L.divIcon({
      html: `<div style="background:${isRestaurantRoute ? '#f59e0b' : '#367666'}; width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid white; box-shadow:0 2px 10px rgba(0,0,0,0.15);">${isRestaurantRoute ? '🏪' : '🏠'}</div>`,
      iconSize: [42, 42],
      className: 'custom-marker'
    });
    window.L.marker([startLat, startLon], { icon: startIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${isRestaurantRoute ? '🏪 Ресторан' : '📍 Клиент'}</b><br>${customerAddress}`);
    
    // ✅ Маршрут (брендовый цвет #367666)
    if (routeData.waypoints && routeData.waypoints.length > 0) {
      const latlngs = routeData.waypoints.map((p: any) => [p.lat, p.lon]);
      routePolylineRef.current = window.L.polyline(latlngs, { 
        color: '#367666',  // ← новый брендовый цвет
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(mapInstanceRef.current);
      
      const bounds = window.L.latLngBounds(latlngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // ✅ Машина курьера (брендовый цвет #367666)
    const carIcon = window.L.divIcon({
      html: '<div style="background:#367666; width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:26px; border:3px solid white; box-shadow:0 2px 15px rgba(54,118,102,0.4);">🚚</div>',
      iconSize: [48, 48],
      className: 'custom-marker'
    });
    driverMarkerRef.current = window.L.marker([startLat, startLon], { icon: carIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('🚚 Курьер');
    
    // ✅ Добавляем зум контрол в правый нижний угол
    window.L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
    
    console.log('✅ Карта инициализирована');
  };

  if (!mapLoaded || loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#e8f3f0] rounded-xl p-3 text-sm text-[#367666] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <span>Маршрут построен</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📏</span>
          <span className="font-medium">{totalDistance.toFixed(1)} км</span>
        </div>
      </div>
      <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden bg-gray-100 shadow-md" />
    </div>
  );
}