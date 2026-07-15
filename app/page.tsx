// app/page.tsx - С ОБЕРТКОЙ В BrowserGuard

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Store, Gift, MapPin } from 'lucide-react';
import OfferCard from './components/OfferCard';
import { useWebSocket } from './hooks/useWebSocket';
import { setGlobalHideBottomNav } from './layout';
import { useLanguage } from './components/LanguageSwitcher';
import BrowserGuard from './components/BrowserGuard';

const SuppliersMap = dynamic(() => import('./components/SuppliersMap'), { ssr: false });

type ViewMode = 'list' | 'map';

interface SurpriseBag {
  id: number;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url: string;
  available_quantity: number;
  supplier_name: string;
  supplier_id: number;
  is_active?: boolean;
  supplier_lat?: number;
  supplier_lon?: number;
  business_type?: string;
  address?: string;
  working_time?: string;
  opening_time?: string;
  closing_time?: string;    
  rating?: number;
  total_reviews?: number;
  pickup_time?: string;  
}

interface LocationData {
  lat: number;
  lon: number;
  city: string;
  source: 'geolocation' | 'cached';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function HomePageContent() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [user, setUser] = useState<{ name: string; id: number; phone?: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const isMountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);
  const geoWatchIdRef = useRef<number | null>(null);

  // ✅ ПРОВЕРЯЕМ КЭШ ПРИ ЗАГРУЗКЕ
  useEffect(() => {
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        const cacheAge = Date.now() - (parsed.timestamp || 0);
        const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
        
        if (cacheAge < CACHE_MAX_AGE) {
          console.log('📦 Используем кэшированную локацию:', parsed.city);
          setLocation({
            lat: parsed.lat,
            lon: parsed.lon,
            city: parsed.city,
            source: 'cached'
          });
          setLocationLoading(false);
          return;
        } else {
          localStorage.removeItem('userLocation');
        }
      } catch (e) {
        localStorage.removeItem('userLocation');
      }
    }
    
    requestGeolocation();
  }, []);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация не поддерживается');
      setLocationLoading(false);
      return;
    }

    console.log('📍 Запрос геолокации...');
    setLocationLoading(true);
    setLocationError(null);
    setIsRetrying(false);

    if (geoWatchIdRef.current) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
    }

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 GPS: ${latitude}, ${longitude}, точность: ${accuracy}м`);
        
        if (accuracy > 100) {
          console.log(`⚠️ Точность низкая (${accuracy}м), ждем...`);
          return;
        }

        if (geoWatchIdRef.current) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru&zoom=10`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Актобе';
          
          const locationData = {
            lat: latitude,
            lon: longitude,
            city: city,
            source: 'geolocation' as const
          };
          
          localStorage.setItem('userLocation', JSON.stringify({
            ...locationData,
            timestamp: Date.now()
          }));
          
          setLocation(locationData);
          setLocationLoading(false);
          setLocationError(null);
          console.log('✅ Город:', city);
        } catch (error) {
          console.warn('⚠️ Ошибка определения города:', error);
          const locationData = {
            lat: latitude,
            lon: longitude,
            city: 'Актобе',
            source: 'geolocation' as const
          };
          localStorage.setItem('userLocation', JSON.stringify({
            ...locationData,
            timestamp: Date.now()
          }));
          setLocation(locationData);
          setLocationLoading(false);
        }
      },
      (error) => {
        console.warn('⚠️ Ошибка GPS:', error.message);
        
        if (geoWatchIdRef.current) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }

        const cachedLocation = localStorage.getItem('userLocation');
        if (cachedLocation) {
          try {
            const parsed = JSON.parse(cachedLocation);
            console.log('📦 Используем кэш при ошибке:', parsed.city);
            setLocation({
              lat: parsed.lat,
              lon: parsed.lon,
              city: parsed.city,
              source: 'cached'
            });
            setLocationLoading(false);
            setLocationError(`GPS: ${error.message}. Используем сохраненную локацию`);
            return;
          } catch (e) {}
        }

        setLocationError(`Не удалось определить местоположение: ${error.message}`);
        setLocationLoading(false);
        
        if (error.code === 1) {
          setLocationError('Разрешите доступ к геолокации в настройках браузера');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 60000 
      }
    );
  }, []);

  const retryGeolocation = useCallback(() => {
    setIsRetrying(true);
    localStorage.removeItem('userLocation');
    setLocation(null);
    requestGeolocation();
  }, [requestGeolocation]);

  useEffect(() => {
    console.log('📍 Локация:', location);
  }, [location]);

  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
  }, []);

  const fetchBags = useCallback(async (showLoading = false, isInitial = false) => {
    if (!isMountedRef.current) return;
    
    if (showLoading && !isInitial) {
      setIsRefreshing(true);
    }
    
    try {
      const token = getAuthToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      let url = 'https://toogood-production.up.railway.app/api/surprise-bags';
      if (location?.lat && location?.lon) {
        url += `?lat=${location.lat}&lon=${location.lon}`;
      }
      
      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });
      
      if (response.status === 401) {
        const retryResponse = await fetch('/api/surprise-bags', {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}`);
        }
        
        const data = await retryResponse.json();
        const filteredBags = data.filter((bag: SurpriseBag) => bag.available_quantity > 0);
        
        if (isMountedRef.current) {
          setBags(filteredBags);
          setLastUpdate(new Date());
        }
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const filteredBags = data.filter((bag: SurpriseBag) => bag.available_quantity > 0);
      
      if (isMountedRef.current) {
        setBags(filteredBags);
        setLastUpdate(new Date());
        console.log('✅ Загружено', filteredBags.length, 'сюрпризов');
      }
    } catch (err) {
      console.error('❌ Ошибка загрузки:', err);
      if (isMountedRef.current) {
        setBags([]);
      }
    } finally {
      if (isMountedRef.current) {
        if (showLoading && !isInitial) setIsRefreshing(false);
        if (isInitial) setLoading(false);
      }
    }
  }, [getAuthToken, location]);

  useEffect(() => {
    if (locationLoading || showSplash) return;
    if (!initialLoadDoneRef.current && location) {
      initialLoadDoneRef.current = true;
      fetchBags(true, true);
    }
  }, [locationLoading, showSplash, fetchBags, location]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    isMountedRef.current = true;
    
    const hasLoaded = sessionStorage.getItem('has_loaded');
    
    if (!hasLoaded) {
      setGlobalHideBottomNav(true);
      setShowSplash(true);
      
      const timer = setTimeout(() => {
        setShowSplash(false);
        setGlobalHideBottomNav(false);
        sessionStorage.setItem('has_loaded', 'true');
      }, 3500);
      
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
      setGlobalHideBottomNav(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed.full_name || parsed.name,
          id: parsed.id,
          phone: parsed.phone
        });
      } catch(e) {}
    }
    
    const fetchUser = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch('https://toogood-production.up.railway.app/check-auth', { 
          credentials: 'include',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            const userData = {
              name: data.user_name || data.user?.full_name,
              id: data.user_id || data.user?.id,
              phone: data.user_phone || data.user?.phone
            };
            setUser(userData);
            sessionStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [getAuthToken]);

  const wsUrl = userToken 
    ? `wss://toogood-production.up.railway.app/ws?token=${encodeURIComponent(userToken)}` 
    : null;
  
  const { isConnected, lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (!lastMessage) return;
    
    if (lastMessage.type === 'new_bag' || lastMessage.type === 'update_bag') {
      fetchBags(false, false);
    }
    
    if (lastMessage.type === 'delete_bag') {
      fetchBags(false, false);
    }
    
    if (lastMessage.type === 'bag_quantity_updated' && lastMessage.data) {
      const { bag_id, available_quantity, is_active } = lastMessage.data;
      
      setBags(prevBags => {
        const updatedBags = prevBags.map(bag => 
          bag.id === bag_id 
            ? { ...bag, available_quantity: available_quantity, is_active: is_active ?? bag.is_active }
            : bag
        );
        const filteredBags = updatedBags.filter(bag => bag.available_quantity > 0);
        if (filteredBags.length !== prevBags.length) setLastUpdate(new Date());
        return filteredBags;
      });
    }
  }, [lastMessage, fetchBags]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (geoWatchIdRef.current) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleRefreshOffers = () => {
      fetchBags(false, false);
    };
    window.addEventListener('refreshOffers', handleRefreshOffers);
    return () => window.removeEventListener('refreshOffers', handleRefreshOffers);
  }, [fetchBags]);

  const LogoCircle = () => {
    const [imgError, setImgError] = useState(false);
    
    if (imgError) {
      return (
        <div className="w-56 h-56 mx-auto rounded-full bg-white/20 flex items-center justify-center shadow-2xl">
          <div className="text-4xl font-bold tracking-tight">
            <span className="text-black">SARQYT</span>
            <span className="text-[#FF9500]">GO</span>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-56 h-56 mx-auto rounded-full overflow-hidden shadow-2xl">
        <div className="relative w-full h-full scale-[1.4]">
          <Image 
            src="/logotype.jpeg" 
            alt="SARQYT GO" 
            fill
            className="object-cover"
            priority
            onError={() => setImgError(true)}
          />
        </div>
      </div>
    );
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#367666] flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <LogoCircle />
        </div>
      </div>
    );
  }

  if (loading || locationLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  if (locationError && !location) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md shadow-lg">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-xl font-bold mb-2">Не удалось определить местоположение</h2>
          <p className="text-gray-500 text-sm mb-6">{locationError}</p>
          <button 
            onClick={retryGeolocation}
            disabled={isRetrying}
            className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition disabled:opacity-50"
          >
            {isRetrying ? 'Повтор...' : 'Попробовать снова'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="bg-[#367666] text-white px-6 pt-6 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-white">SARQYT</span>{' '}
              <span className="text-[#FFD700]">GO</span>
            </h1>
            {user?.phone && (
              <p className="text-sm text-white/80 mt-1 font-medium">
                {user.phone}
              </p>
            )}
          </div>
          {location?.city && (
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{location.city}</span>
              </span>
            </div>
          )}
        </div>
        {location?.source === 'cached' && (
          <p className="text-xs text-white/60 mt-1">
            📦 Используется сохраненная локация
          </p>
        )}
        {locationError && (
          <p className="text-xs text-yellow-200 mt-1">
            ⚠️ {locationError}
          </p>
        )}
      </div>

      <div className="px-6 -mt-4">
        <input 
          type="text" 
          placeholder={t('search')}
          className="w-full px-6 py-4 rounded-2xl bg-white shadow-md text-base focus:outline-none focus:ring-2 focus:ring-[#367666] placeholder:text-gray-400"
        />
      </div>

      <div className="px-6 mt-4">
        <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              viewMode === 'list' 
                ? 'bg-white shadow text-[#367666]' 
                : 'text-gray-400 hover:text-[#367666] hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>{t('list')}</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              viewMode === 'map' 
                ? 'bg-white shadow text-[#367666]' 
                : 'text-gray-400 hover:text-[#367666] hover:bg-white/50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>{t('map')}</span>
          </button>
        </div>
      </div>

      <div className="px-3 mt-6 pb-32">
        {viewMode === 'list' ? (
          <>
            <div className="mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Store size={20} className="text-gray-400/60" />
                {t('nearbyShops')}
              </h2>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                <Gift size={14} className="text-gray-400" />
                Сюрприз-пакеты рядом с вами
              </p>
            </div>
            
            {user && (
              <Link href="/orders">
                <button className="w-full bg-[#367666]/10 text-[#367666] py-2.5 rounded-xl text-sm font-medium hover:bg-[#367666]/20 transition flex items-center justify-center gap-2 mb-4">
                  <span>📋</span>
                  <span>{t('myOrders')}</span>
                </button>
              </Link>
            )}
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">{t('nearbyOffers')}</h3>
              <button 
                onClick={() => fetchBags(true, false)}
                disabled={isRefreshing}
                className="bg-[#367666] text-white px-3 py-1 rounded-full text-xs hover:bg-[#2a5a4d] transition flex items-center gap-1 disabled:opacity-50"
              >
                {isRefreshing ? '...' : t('refresh')}
              </button>
            </div>
            
            <div className="text-right text-xs text-gray-400 mb-3">
              {t('lastUpdate')}: {lastUpdate.toLocaleTimeString()}
              {isConnected && <span className="ml-2 text-green-500">● Live</span>}
            </div>
            
            <div className="flex flex-col gap-3">
              {bags.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t('noOffers')}</p>
                </div>
              ) : (
                bags.map((bag, bagIdx) => {
                  let distanceText = '0 км';
                  
                  if (location && bag.supplier_lat && bag.supplier_lon) {
                    const dist = calculateDistance(
                      location.lat, 
                      location.lon, 
                      bag.supplier_lat, 
                      bag.supplier_lon
                    );
                    distanceText = dist < 1 
                      ? `${Math.round(dist * 1000)} м` 
                      : `${dist.toFixed(1)} км`;
                  }
                  
                  return (
                    <OfferCard
                      key={`${bag.id}-${lastUpdate.getTime()}-${bagIdx}`}
                      id={bag.id}
                      name={bag.name}
                      businessName={bag.supplier_name}
                      distance={distanceText}
                      price={bag.discounted_price}
                      originalPrice={bag.original_price}
                      discount={bag.discount_percentage}
                      imageUrl={bag.image_url}
                      description={bag.description}
                      onOrderSuccess={() => fetchBags()}
                      businessType={bag.business_type}
                      address={bag.address}
                      workingTime={bag.working_time}
                      openingTime={bag.opening_time}
                      closingTime={bag.closing_time}  
                    />
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-[500px]">
            <SuppliersMap 
              userLat={location?.lat || 50.318754} 
              userLon={location?.lon || 57.368359}
              onSupplierClick={(id, name) => router.push(`/supplier/${id}`)}
              showUserLocation={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ ГЛАВНЫЙ КОМПОНЕНТ С BrowserGuard
export default function HomePage() {
  return (
    <BrowserGuard>
      <HomePageContent />
    </BrowserGuard>
  );
}