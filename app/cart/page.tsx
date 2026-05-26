// app/cart/page.tsx
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
  const [paymentMethod, setPaymentMethod] = useState('kaspi');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: ''
  });
  const [paymentError, setPaymentError] = useState('');
  const [processingStep, setProcessingStep] = useState<'form' | 'processing' | 'success'>('form');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [customerAddress, setCustomerAddress] = useState('');

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
      paymentMethod: 'Төлем әдісін таңдаңыз',
      amount: 'Сома',
      back: 'Артқа',
      pay: 'Төлеу (демо)',
      kaspiDesc: 'Kaspi.kz арқылы төлеу',
      otherMethods: 'Басқа төлем әдістері (демо)',
      cardNumber: 'Карта нөмірі',
      expiry: 'Мерзім',
      emptyCart: 'Себет бос',
      addItems: 'Тауарларды қосыңыз',
      shop: 'Сатып алу',
      bookingExpired: 'Броньдеу уақыты аяқталды! Тауар сатылымға қайтарылды.',
      bookingWarning: 'Броньдеу уақыты аяқталуға жақын',
      timeRemaining: 'Қалған уақыт',
      deliveryAddress: 'Жеткізу мекенжайы',
      enterAddress: 'Мекенжайыңызды енгізіңіз'
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
      paymentMethod: 'Выберите способ оплаты',
      amount: 'Сумма',
      back: 'Назад',
      pay: 'Оплатить (демо)',
      kaspiDesc: 'Оплата через Kaspi.kz',
      otherMethods: 'Другие способы оплаты (демо)',
      cardNumber: 'Номер карты',
      expiry: 'Срок',
      emptyCart: 'Корзина пуста',
      addItems: 'Добавьте товары',
      shop: 'Перейти к покупкам',
      bookingExpired: 'Время бронирования истекло! Товар возвращен в продажу.',
      bookingWarning: 'Время бронирования истекает',
      timeRemaining: 'Осталось',
      deliveryAddress: 'Адрес доставки',
      enterAddress: 'Введите ваш адрес'
    }
  };

  // Защита страницы
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Получаем геолокацию при загрузке
  useEffect(() => {
    if (navigator.geolocation) {
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
  }, []);

  // Функция проверки резервации
  const checkReservation = async () => {
    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/cart/reservation', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.reservation) {
        setReservation(data.reservation);
      }
    } catch (error) {
      console.error('Error checking reservation:', error);
    }
  };

  // Загрузка корзины и проверка резервации
  useEffect(() => {
    loadCart();
    checkReservation();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  // Синхронизация резервации из товаров корзины
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

  // Таймер обратного отсчета
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
    // ✅ sessionStorage вместо localStorage
    const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
    setCartItems(cart);
    
    // Проверяем, есть ли активная резервация в товарах
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
    if (!customerAddress) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }
    setPaymentError('');
    setProcessingStep('form');
    setShowPaymentModal(true);
  };

  // Создание заказа перед оплатой
  const createOrders = async () => {
    const createdOrders = [];
    
    for (const item of cartItems) {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bag_id: item.id,
          lat: userLocation?.lat || 43.238,
          lon: userLocation?.lon || 76.945,
          address: customerAddress
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
      alert(error instanceof Error ? error.message : 'Ошибка при создании заказа');
      setProcessingStep('form');
    }
  };

  const validateCardDetails = () => {
    const cleanNumber = cardDetails.number.replace(/\s/g, '');
    if (cleanNumber.length !== 16 && cleanNumber.length > 0) {
      setPaymentError('Введите корректный номер карты (16 цифр)');
      return false;
    }
    return true;
  };

  const processPayment = async () => {
    if (!validateCardDetails()) return;
    
    setProcessingStep('processing');
    
    try {
      const orders = await createOrders();
      console.log('✅ Заказы созданы:', orders);
      
      if (reservation) {
        await fetch('https://toogood-2ncf.onrender.com/api/payment/confirm-reservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reservation_id: reservation.id })
        });
      }
      
      setTimeout(() => {
        setProcessingStep('success');
        sessionStorage.removeItem('cart');
        setCartItems([]);
        
        setTimeout(() => {
          setShowPaymentModal(false);
          router.push('/orders');
        }, 2000);
      }, 2000);
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('Ошибка при оформлении заказа');
      setProcessingStep('form');
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const fillDemoCard = (method: string) => {
    const demos = {
      kaspi: { number: '4405 1234 5678 9012', expiry: '12/26', cvv: '123' },
      halyk: { number: '4400 1234 5678 9012', expiry: '12/26', cvv: '123' },
      mastercard: { number: '5555 1234 5678 9012', expiry: '12/26', cvv: '123' },
      visa: { number: '4111 1234 5678 9012', expiry: '12/26', cvv: '123' }
    };
    const demo = demos[method as keyof typeof demos];
    if (demo) {
      setCardDetails({
        number: demo.number,
        expiry: demo.expiry,
        cvv: demo.cvv,
        holder: 'TEST USER'
      });
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
          
          {/* Поле для ввода адреса */}
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
            disabled={timeLeft === 0 || !customerAddress}
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
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">💳</div>
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
              
              {/* KASPI QR */}
              <button
                onClick={handleKaspiPayment}
                className="w-full p-5 rounded-2xl border-2 border-[#EA0033] bg-[#EA0033]/5 mb-4 transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#EA0033] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">K</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-lg">Kaspi QR</h3>
                    <p className="text-sm text-gray-500">{t[lang].kaspiDesc}</p>
                  </div>
                  <span className="text-2xl">→</span>
                </div>
              </button>

              <details className="mt-2">
                <summary className="text-center text-sm text-gray-400 cursor-pointer py-2">
                  💳 {t[lang].otherMethods}
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {['halyk', 'mastercard', 'visa'].map((method) => (
                      <button
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method);
                          fillDemoCard(method);
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === method ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="text-2xl mb-1">
                          {method === 'halyk' && '🏦'}
                          {method === 'mastercard' && '💳'}
                          {method === 'visa' && '💳'}
                        </div>
                        <div className="text-sm font-medium capitalize">{method}</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t[lang].cardNumber}</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({...cardDetails, number: formatCardNumber(e.target.value)})}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                        maxLength={19}
                      />
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t[lang].expiry}</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          maxLength={5}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                          maxLength={3}
                        />
                      </div>
                    </div>
                    
                    {paymentError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">⚠️ {paymentError}</div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold"
                      >
                        {t[lang].back}
                      </button>
                      <button
                        onClick={processPayment}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-semibold"
                      >
                        {t[lang].pay}
                      </button>
                    </div>
                  </div>
                </div>
              </details>

              <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700 text-center">
                  🔒 {lang === 'kz' ? 'Kaspi.kz төлем бетіне өту' : 'Переход на страницу оплаты Kaspi.kz'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}