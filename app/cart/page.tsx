'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../layout';

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

export default function CartPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingStep, setProcessingStep] = useState<'form' | 'processing' | 'success'>('form');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

  const KASPI_QR_URL = "https://qr.kaspi.kz/1741208973003042970126358999951585929937";

  const t = {
    kz: {
      cart: 'Себет',
      timeLeft: 'Броньдеу уақыты',
      payBefore: 'Мерзімі өткенше төлеңіз',
      orElse: 'Әйтпесе тауар сатылымға қайтарылады',
      total: 'Барлығы',
      items: 'тауар',
      checkout: 'Тапсырыс беру',
      timeExpired: 'Уақыт өтті',
      paymentMethod: 'Kaspi QR арқылы төлеу',
      amount: 'Сома',
      back: 'Артқа',
      pay: 'Kaspi QR арқылы төлеу',
      emptyCart: 'Себет бос',
      addItems: 'Тауарларды қосыңыз',
      shop: 'Сатып алу',
      bookingExpired: 'Броньдеу уақыты аяқталды! Тауар сатылымға қайтарылды.',
      bookingWarning: 'Броньдеу уақыты аяқталуға жақын',
      timeRemaining: 'Қалған уақыт',
      deliveryAddress: 'Жеткізу мекенжайы',
      enterAddress: 'Мекенжайыңызды енгізіңіз',
      processing: 'Өңделуде',
      redirecting: 'Төлем бетіне өту...',
      deliveryType: 'Жеткізу түрі',
      courier: 'Курьермен жеткізу',
      pickup: 'Өзім алып кетемін',
      pickupAddress: 'Алып кету мекенжайы'
    },
    ru: {
      cart: 'Корзина',
      timeLeft: 'Время бронирования',
      payBefore: 'Оплатите до истечения',
      orElse: 'Иначе товар вернется в продажу',
      total: 'Итого',
      items: 'товаров',
      checkout: 'Оформить заказ',
      timeExpired: 'Время истекло',
      paymentMethod: 'Оплата через Kaspi QR',
      amount: 'Сумма',
      back: 'Назад',
      pay: 'Оплатить Kaspi QR',
      emptyCart: 'Корзина пуста',
      addItems: 'Добавьте товары',
      shop: 'Перейти к покупкам',
      bookingExpired: 'Время бронирования истекло! Товар возвращен в продажу.',
      bookingWarning: 'Время бронирования истекает',
      timeRemaining: 'Осталось',
      deliveryAddress: 'Адрес доставки',
      enterAddress: 'Введите ваш адрес',
      processing: 'Обработка',
      redirecting: 'Переход на страницу оплаты...',
      deliveryType: 'Способ получения',
      courier: 'Доставка курьером',
      pickup: 'Самовывоз',
      pickupAddress: 'Адрес самовывоза'
    }
  };

  const getAuthToken = () => sessionStorage.getItem('authToken');

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      console.error('❌ Нет токена');
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
      const response = await authFetch('https://toogood-2ncf.onrender.com/api/cart/reservation');
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
      alert(`⏰ ${t[lang].bookingExpired}`);
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
        alert(`⏰ ${t[lang].bookingExpired}`);
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
  }, [reservation, router, showTimerWarning, lang, t]);

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

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (deliveryType === 'delivery' && !customerAddress) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }
    setProcessingStep('form');
    setShowPaymentModal(true);
  };

  const createOrders = async () => {
    const token = getAuthToken();
    console.log('🔑 Токен для запроса:', token ? `${token.substring(0, 30)}...` : 'НЕТ ТОКЕНА');
    
    const createdOrders = [];
    
    for (const item of cartItems) {
      const response = await authFetch('https://toogood-2ncf.onrender.com/api/orders', {
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
      alert('Ошибка авторизации. Пожалуйста, войдите заново.');
      router.push('/login');
      return;
    }
    
    setProcessingStep('processing');
    
    try {
      const orders = await createOrders();
      console.log('✅ Заказы созданы:', orders);
      
      sessionStorage.setItem('pending_order', JSON.stringify({
        orders: orders,
        total: getTotalPrice(),
        timestamp: Date.now()
      }));
      
      window.location.href = KASPI_QR_URL;
      
    } catch (error) {
      console.error('Error creating orders:', error);
      let errorMessage = 'Ошибка при создании заказа';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(errorMessage);
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
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t[lang].emptyCart}</h1>
          <p className="text-gray-500 mb-6">{t[lang].addItems}</p>
          <Link href="/offers">
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition">
              {t[lang].shop}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-800">{t[lang].cart}</h1>
            
            <div className="flex gap-1">
              <button
                onClick={() => setLang('kz')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  lang === 'kz' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Қаз
              </button>
              <button
                onClick={() => setLang('ru')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                  lang === 'ru' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Рус
              </button>
            </div>
          </div>
          
          {/* Способ получения */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📦 {t[lang].deliveryType}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  deliveryType === 'delivery'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                🚚 {t[lang].courier}
              </button>
              <button
                onClick={() => setDeliveryType('pickup')}
                className={`flex-1 py-3 rounded-xl font-semibold transition ${
                  deliveryType === 'pickup'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                🏪 {t[lang].pickup}
              </button>
            </div>
          </div>
          
          {/* Адрес доставки (только для доставки) */}
          {deliveryType === 'delivery' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 {t[lang].deliveryAddress}
              </label>
              <input
                type="text"
                placeholder={t[lang].enterAddress}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          )}
          
          {/* Информация о самовывозе */}
          {deliveryType === 'pickup' && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700">
                🏪 {t[lang].pickupAddress}: Ресторан по адресу, указанному при оформлении
              </p>
            </div>
          )}
          
          {timeLeft !== null && timeLeft > 0 && (
            <div className={`mb-4 p-4 rounded-2xl ${showTimerWarning ? 'bg-red-50 border border-red-200' : 'bg-yellow-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className={`text-sm font-semibold ${showTimerWarning ? 'text-red-600' : 'text-yellow-700'}`}>
                      {t[lang].timeLeft}
                    </p>
                    <p className={`text-2xl font-mono font-bold ${showTimerWarning ? 'text-red-600 animate-pulse' : 'text-yellow-700'}`}>
                      {formatTimeLeft(timeLeft)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{t[lang].payBefore}</p>
                  <p className="text-xs text-gray-400">{t[lang].orElse}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <div className="text-2xl font-bold text-emerald-600">
              {getTotalPrice().toLocaleString()} ₸
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getTotalItems()} {t[lang].items}
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={timeLeft === 0 || (deliveryType === 'delivery' && !customerAddress)}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-md active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl">💳</span>
            <span>{timeLeft === 0 ? t[lang].timeExpired : t[lang].checkout}</span>
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="px-4 py-4 space-y-3 pb-8">
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
                  <span className="text-lg font-bold text-emerald-600">{item.price} ₸</span>
                  {item.originalPrice > item.price && (
                    <span className="text-gray-400 line-through text-xs ml-2">{item.originalPrice} ₸</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >-</button>
                  <span className="font-semibold text-sm min-w-[25px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >+</button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-1 text-red-500 hover:text-red-700 text-sm"
                  >🗑️</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">📱</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t[lang].paymentMethod}</h2>
                <p className="text-gray-500">
                  {t[lang].amount}: <span className="font-bold text-emerald-600 text-xl">{getTotalPrice()} ₸</span>
                </p>
                {timeLeft && timeLeft > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⏰ {t[lang].timeRemaining}: {formatTimeLeft(timeLeft)}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleKaspiPayment}
                disabled={processingStep === 'processing'}
                className="w-full p-5 rounded-2xl border-2 border-[#EA0033] bg-[#EA0033]/5 mb-4 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#EA0033] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">K</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-lg">Kaspi QR</h3>
                    <p className="text-sm text-gray-500">
                      {processingStep === 'processing' ? t[lang].redirecting : t[lang].pay}
                    </p>
                  </div>
                  {processingStep === 'processing' ? (
                    <div className="w-6 h-6 border-2 border-[#EA0033] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-2xl">→</span>
                  )}
                </div>
              </button>

              <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700 text-center">
                  🔒 {lang === 'kz' ? 'Kaspi.kz төлем бетіне өтесіз' : 'Вы перейдете на страницу оплаты Kaspi.kz'}
                </p>
              </div>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
              >
                {t[lang].back}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}