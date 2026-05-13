// components/DeliveryMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface DeliveryMapProps {
  supplierLat?: number;
  supplierLon?: number;
  customerLat?: number;
  customerLon?: number;
  supplierName?: string;
  customerAddress?: string;
  userLat?: number;
  userLon?: number;
  orderStatus?: string;
  onProgressUpdate?: (progress: number) => void;
}

export default function DeliveryMap({
  supplierLat: propSupplierLat,
  supplierLon: propSupplierLon,
  customerLat: propCustomerLat,
  customerLon: propCustomerLon,
  supplierName = 'Ресторан',
  customerAddress = 'Ваш адрес',
  userLat,
  userLon,
  orderStatus,
  onProgressUpdate
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [supplierLat, setSupplierLat] = useState(propSupplierLat || 0);
  const [supplierLon, setSupplierLon] = useState(propSupplierLon || 0);
  const [customerLat, setCustomerLat] = useState(propCustomerLat || 0);
  const [customerLon, setCustomerLon] = useState(propCustomerLon || 0);
  const [driverMarker, setDriverMarker] = useState<L.Marker | null>(null);
  const [roadPoints, setRoadPoints] = useState<{ lat: number; lon: number }[]>([]);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const ORS_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYyMDU3ZGE4OTkxODQ2M2JhNmVlZDgzM2QzMDE2OTYwIiwiaCI6Im11cm11cjY0In0=";

  const decodePolyline = (str: string): [number, number][] => {
    let index = 0;
    let lat = 0;
    let lng = 0;
    const coords: [number, number][] = [];
    
    while (index < str.length) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;
      
      shift = 0;
      result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;
      
      coords.push([lat / 1e5, lng / 1e5]);
    }
    return coords;
  };

  const loadRoute = async () => {
    if (!map) return;

    try {
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Authorization': ORS_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [[supplierLon, supplierLat], [customerLon, customerLat]]
        })
      });

      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const decoded = decodePolyline(route.geometry);
        
        const points = decoded.map(coord => ({ lat: coord[0], lon: coord[1] }));
        setRoadPoints(points);
        
        const distance = route.summary.distance / 1000;
        const time = Math.round(route.summary.duration / 60);
        setTotalDistance(distance);
        setTotalTime(time);

        const latlngs: L.LatLngExpression[] = points.map(p => [p.lat, p.lon]);
        L.polyline(latlngs, { color: '#fbbf24', weight: 5, dashArray: '8,8' }).addTo(map);
        
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds);
        
        if (orderStatus === 'out_for_delivery' && !animationStarted) {
          startAnimation();
        }
      } else {
        fallbackToStraightLine();
      }
    } catch (error) {
      console.error('ORS error:', error);
      fallbackToStraightLine();
    }
  };

  const fallbackToStraightLine = () => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      points.push({
        lat: supplierLat + (customerLat - supplierLat) * t,
        lon: supplierLon + (customerLon - supplierLon) * t
      });
    }
    setRoadPoints(points);
    
    const dlat = customerLat - supplierLat;
    const dlon = customerLon - supplierLon;
    const distance = Math.sqrt(dlat * dlat + dlon * dlon) * 111;
    const time = Math.round((distance / 40) * 60);
    setTotalDistance(distance);
    setTotalTime(time);
    
    const latlngs: L.LatLngExpression[] = points.map(p => [p.lat, p.lon]);
    L.polyline(latlngs, { color: '#fbbf24', weight: 4, dashArray: '8,8' }).addTo(map);
    
    const bounds = L.latLngBounds(latlngs);
    map?.fitBounds(bounds);
    
    if (orderStatus === 'out_for_delivery' && !animationStarted) {
      startAnimation();
    }
  };

  const updateCar = (progress: number) => {
    if (!driverMarker || roadPoints.length === 0) return;
    
    const idx = Math.floor((progress / 100) * (roadPoints.length - 1));
    const safeIdx = Math.min(Math.max(idx, 0), roadPoints.length - 1);
    const point = roadPoints[safeIdx];
    driverMarker.setLatLng([point.lat, point.lon]);
    
    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }
  };

  const startAnimation = () => {
    if (animationStarted) return;
    setAnimationStarted(true);
    
    let progress = 0;
    const totalSteps = 100;
    const stepDelay = Math.max(50, (totalTime * 60 * 1000) / totalSteps);
    
    const interval = setInterval(() => {
      if (progress < totalSteps) {
        progress++;
        updateCar(progress);
      } else {
        clearInterval(interval);
        updateCar(100);
      }
    }, stepDelay);
    
    return () => clearInterval(interval);
  };

  const getCityFromCoords = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
      );
      const data = await response.json();
      return data.address?.city || data.address?.town || data.address?.village || '';
    } catch {
      return '';
    }
  };

  const getCoordsFromCity = async (city: string): Promise<{ lat: number; lon: number } | null> => {
    if (!city) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
      );
      const data = await response.json();
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Detect user city
  useEffect(() => {
    const detectUserCity = async () => {
      if (userLat && userLon) {
        const city = await getCityFromCoords(userLat, userLon);
        if (city) setUserCity(city);
        setLoading(false);
        return;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const city = await getCityFromCoords(lat, lon);
            
            if (city) {
              setUserCity(city);
              if (!supplierLat && !propSupplierLat) {
                setSupplierLat(lat);
                setSupplierLon(lon);
              }
              if (!customerLat && !propCustomerLat) {
                setCustomerLat(lat + 0.01);
                setCustomerLon(lon + 0.01);
              }
            } else {
              setUserCity('местоположение не определено');
            }
            setLoading(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setUserCity('геолокация недоступна');
            setLoading(false);
          }
        );
      } else {
        setUserCity('геолокация не поддерживается');
        setLoading(false);
      }
    };

    detectUserCity();
  }, [userLat, userLon]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || loading || !userCity || userCity.includes('не')) return;

    const initMap = async () => {
      let centerLat = 0;
      let centerLon = 0;
      
      const cityCoords = await getCoordsFromCity(userCity);
      if (cityCoords) {
        centerLat = cityCoords.lat;
        centerLon = cityCoords.lon;
      } else if (supplierLat && supplierLon) {
        centerLat = supplierLat;
        centerLon = supplierLon;
      } else if (customerLat && customerLon) {
        centerLat = customerLat;
        centerLon = customerLon;
      } else {
        setLoading(false);
        return;
      }

      const newMap = L.map(mapRef.current!).setView([centerLat, centerLon], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(newMap);
      
      setMap(newMap);
      
      // Supplier marker
      if (supplierLat && supplierLon && supplierLat !== 0 && supplierLon !== 0) {
        const startIcon = L.divIcon({
          html: '<div style="background:#166534; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:3px solid white;">🏪</div>',
          iconSize: [36, 36],
          className: 'custom-div-icon'
        });
        L.marker([supplierLat, supplierLon], { icon: startIcon })
          .addTo(newMap)
          .bindPopup(`🏪 ${supplierName}`);
      }
      
      // Customer marker
      if (customerLat && customerLon && customerLat !== 0 && customerLon !== 0) {
        const endIcon = L.divIcon({
          html: '<div style="background:#dc2626; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:3px solid white;">🏠</div>',
          iconSize: [36, 36],
          className: 'custom-div-icon'
        });
        L.marker([customerLat, customerLon], { icon: endIcon })
          .addTo(newMap)
          .bindPopup(`🏠 ${customerAddress}`);
      }
      
      // Driver car marker
      const carIcon = L.divIcon({
        html: '<div style="background:#3b82f6; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; border:3px solid white; box-shadow:0 2px 10px rgba(59,130,246,0.4);">🚚</div>',
        iconSize: [45, 45],
        className: 'custom-div-icon'
      });
      const carMarker = L.marker([supplierLat || centerLat, supplierLon || centerLon], { icon: carIcon }).addTo(newMap);
      setDriverMarker(carMarker);
      
      // Load route
      if (supplierLat && supplierLon && customerLat && customerLon) {
        await loadRoute();
      }
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [loading, userCity, supplierLat, supplierLon, customerLat, customerLon]);

  if (loading || !userCity || userCity.includes('не')) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">
            {loading ? 'Определение местоположения...' : userCity || 'Геолокация недоступна'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {userCity && !userCity.includes('не') && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
          <span>📍</span>
          <span>Ваш город: <strong>{userCity}</strong></span>
        </div>
      )}
      <div ref={mapRef} className="w-full h-[400px] rounded-xl overflow-hidden" />
      
      {/* Info panel */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <div className="flex justify-between text-sm mb-1">
          <span>Статус доставки</span>
          <span className="text-emerald-600 font-bold">
            {orderStatus === 'out_for_delivery' ? '🚚 В пути' : 
             orderStatus === 'delivered' ? '✅ Доставлен' : 
             orderStatus === 'pending' ? '⏳ Ожидает' :
             orderStatus === 'ready_for_pickup' ? '📦 Готов к выдаче' : '📋 Обрабатывается'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: orderStatus === 'out_for_delivery' ? '50%' : 
                     orderStatus === 'delivered' ? '100%' : 
                     orderStatus === 'ready_for_pickup' ? '75%' : '25%' }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>🚚 {totalDistance.toFixed(1)} км</span>
          <span>⏱️ {totalTime} мин</span>
        </div>
      </div>
    </div>
  );
}