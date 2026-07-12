// app/cart/page.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LanguageProvider, useLanguage } from '../components/LanguageSwitcher';
import { getAuthToken } from '../../lib/api';

interface CartItem {
  id: number;
  name: string;
  businessName: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  quantity: number;
  reservation_id?: number;
  expires_at?: string;
}

interface Reservation {
  id: number;
  expires_at: string;
  bag_id: number;
}

// ✅ ОСНОВНАЯ СТРАНИЦА - ОБЕРТКА
export default function CartPage() {
  return (
    <LanguageProvider>
      <CartContent />
    </LanguageProvider>
  );
}

// ✅ ОСНОВНОЙ КОМПОНЕНТ
function CartContent() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingStep, setProcessingStep] = useState<'form' | 'processing' | 'success'>('form');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup');

  const DELIVERY_FEE = 400;
  const KASPI_QR_URL = "https://qr.kaspi.kz/1741208973003042970126358999951585929937";

const token = getAuthToken();

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      console.error('❌ Нет токена userToken');
      router.push('/login');
      throw new Error('No token');
    }
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (navigator.geolocation && deliveryType === 'delivery') {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation({ lat, lon });
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`
            );
            const data = await response.json();
            const address = data.display_name || `${lat}, ${lon}`;
            setCustomerAddress(address);
          } catch (error) {
            setCustomerAddress(`${lat}, ${lon}`);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [deliveryType]);

  const checkReservation = async () => {
    try {
      const response = await authFetch('/api/cart/reservation');
      if (response.ok) {
        const data = await response.json();
        if (data.reservation) {
          setReservation(data.reservation);
        }
      }
    } catch (error) {
      console.error('Error checking reservation:', error);
    }
  };

  useEffect(() => {
    loadCart();
    checkReservation();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  useEffect(() => {
    const reservationFromCart = cartItems.find((item: any) => item.reservation_id && item.expires_at);
    if (reservationFromCart && !reservation) {
      setReservation({
        id: reservationFromCart.reservation_id,
        expires_at: reservationFromCart.expires_at,
        bag_id: reservationFromCart.id
      });
    }
  }, [cartItems, reservation]);

  useEffect(() => {
    if (!reservation?.expires_at) return;

    let expiresAt = reservation.expires_at;
    if (expiresAt && !expiresAt.endsWith('Z')) {
      expiresAt = expiresAt + 'Z';
    }
    const expires = new Date(expiresAt);
    const now = new Date();
    
    if (expires.getTime() <= now.getTime()) {
      setTimeLeft(0);
      alert(`⏰ ${t('bookingExpired')}`);
      sessionStorage.removeItem('cart');
      setCartItems([]);
      setReservation(null);
      router.push('/');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expires.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        alert(`⏰ ${t('bookingExpired')}`);
        sessionStorage.removeItem('cart');
        setCartItems([]);
        setReservation(null);
        router.push('/');
      } else {
        setTimeLeft(Math.floor(diff / 1000));
        if (diff <= 60000 && !showTimerWarning) {
          setShowTimerWarning(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation, router, showTimerWarning]);

  const loadCart = () => {
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    setCartItems(cart);
    
    const activeReservation = cart.find((item: any) => item.reservation_id && item.expires_at);
    if (activeReservation) {
      setReservation({
        id: activeReservation.reservation_id,
        expires_at: activeReservation.expires_at,
        bag_id: activeReservation.id
      });
    }
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id);
      return;
    }
    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    sessionStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: number) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    sessionStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getSubtotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getDeliveryFee = () => {
    return deliveryType === 'delivery' ? DELIVERY_FEE : 0;
  };

  const getTotalPrice = () => {
    return getSubtotalPrice() + getDeliveryFee();
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (deliveryType === 'delivery' && !customerAddress) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }
    
    setProcessingStep('processing');
    
    try {
      const orders = await createOrders();
      console.log('✅ Заказы созданы, ожидают оплаты:', orders);
      
      sessionStorage.setItem('pending_order', JSON.stringify({
        orders: orders,
        total: getTotalPrice(),
        timestamp: Date.now()
      }));
      
      setShowPaymentModal(true);
      setProcessingStep('form');
      
    } catch (error) {
      console.error('Error creating orders:', error);
      alert('Ошибка при создании заказа');
      setProcessingStep('form');
    }
  };

  const createOrders = async () => {
    const token = getAuthToken();
    console.log('🔑 Токен для запроса:', token ? `${token.substring(0, 30)}...` : 'НЕТ ТОКЕНА');
    
    const createdOrders = [];
    
    for (const item of cartItems) {
      const response = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          bag_id: item.id,
          lat: userLocation?.lat || 43.238,
          lon: userLocation?.lon || 76.945,
          address: deliveryType === 'delivery' ? customerAddress : 'Самовывоз',
          delivery_type: deliveryType
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Ошибка создания заказа для ${item.name}`);
      }
      
      const order = await response.json();
      createdOrders.push(order);
    }
    
    return createdOrders;
  };

  const handleKaspiPayment = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Ошибка авторизации');
      router.push('/login');
      return;
    }
    
    setProcessingStep('processing');
    
    try {
      const pendingData = sessionStorage.getItem('pending_order');
      if (!pendingData) {
        throw new Error('Нет информации о заказах');
      }
      
      window.location.href = KASPI_QR_URL;
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при оплате');
      setProcessingStep('form');
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('emptyCart')}</h1>
          <p className="text-gray-500 mb-6">{t('addItems')}</p>
          <Link href="/offers">
            <button className="bg-[#367666] text-white px-6 py-3 rounded-xl hover:bg-[#2a5a4d] transition">
              {t('shop')}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#367666] text-white px-6 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 21h6" />
            </svg>
            <h1 className="text-xl font-bold">{t('cart')}</h1>
          </div>
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-20">
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('deliveryType')}
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                deliveryType === 'pickup'
                  ? 'bg-[#367666] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t('pickup')}
            </button>
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                deliveryType === 'delivery'
                  ? 'bg-[#367666] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t('courier')}
            </button>
          </div>
          
          {deliveryType === 'delivery' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('deliveryAddress')}
              </label>
              <input
                type="text"
                placeholder={t('enterAddress')}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367666] text-sm"
              />
            </div>
          )}
          
          {deliveryType === 'pickup' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                {t('pickupAddress')}: Ресторан по адресу, указанному при оформлении
              </p>
            </div>
          )}
        </div>
        
        {timeLeft !== null && timeLeft > 0 && (
          <div className={`mb-4 p-4 rounded-2xl ${showTimerWarning ? 'bg-red-50 border border-red-200' : 'bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${showTimerWarning ? 'text-red-600' : 'text-yellow-700'}`}>
                  {t('timeLeft')}
                </p>
                <p className={`text-2xl font-mono font-bold ${showTimerWarning ? 'text-red-600 animate-pulse' : 'text-yellow-700'}`}>
                  {formatTimeLeft(timeLeft)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('payBefore')}</p>
                <p className="text-xs text-gray-400">{t('orElse')}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{t('orderAmount')}</span>
              <span className="text-gray-800">{getSubtotalPrice().toLocaleString()} ₸</span>
            </div>
            {deliveryType === 'delivery' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('deliveryFee')}</span>
                <span className="text-gray-800">{DELIVERY_FEE.toLocaleString()} ₸</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800">{t('totalAmount')}</span>
                <span className="text-2xl font-bold text-[#367666]">
                  {getTotalPrice().toLocaleString()} ₸
                </span>
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">
                {getTotalItems()} {t('items')}
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={timeLeft === 0 || (deliveryType === 'delivery' && !customerAddress)}
          className="w-full bg-[#367666] text-white py-2.8 rounded-2xl font-semibold text-lg shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <span>{timeLeft === 0 ? t('timeExpired') : t('checkout')}</span>
        </button>
        
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop'}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                <p className="text-gray-500 text-xs">{item.businessName}</p>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="text-lg font-bold text-[#367666]">{item.price} ₸</span>
                    {item.originalPrice > item.price && (
                      <span className="text-gray-400 line-through text-xs ml-2">{item.originalPrice} ₸</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-1 text-red-500 hover:text-red-700 text-sm"
                    >✕</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up">
            <div className="bg-gradient-to-r from-[#367666] to-[#367666] px-6 py-5">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-2 shadow-md">
                  <Image 
                    src="/kasp.png" 
                    alt="Kaspi" 
                    width={248} 
                    height={248}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm mb-1">{t('amount')}</p>
                <p className="text-3xl font-bold text-[#367666]">
                  {getTotalPrice().toLocaleString()} ₸
                </p>
                {timeLeft && timeLeft > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {t('timeRemaining')}: {formatTimeLeft(timeLeft)}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleKaspiPayment}
                disabled={processingStep === 'processing'}
                className="w-full bg-[#367666] text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all hover:bg-[#2a5a4d] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {processingStep === 'processing' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('processing')}</span>
                  </>
                ) : (
                  <span>{t('pay')}</span>
                )}
              </button>
              
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg className="w-4 h-4 text-[#367666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Безопасная оплата через Kaspi.kz</span>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition"
              >
                {t('back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}