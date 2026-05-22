// app/cart/page.tsx - С ПЕРЕХОДОМ ПО ССЫЛКЕ KASPI
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface CartItem {
  id: number;
  name: string;
  businessName: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
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

  // ВАША ССЫЛКА НА KASPI QR
  const KASPI_QR_URL = "https://qr.kaspi.kz/1741208973003042970126358999951585929937";

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
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
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: number) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    // Открываем модалку с выбором оплаты
    setPaymentError('');
    setProcessingStep('form');
    setShowPaymentModal(true);
  };

  // 🔥 НОВАЯ ФУНКЦИЯ: переход на Kaspi QR
  const handleKaspiPayment = () => {
    // Сохраняем текущую корзину перед переходом
    localStorage.setItem('pending_order', JSON.stringify({
      items: cartItems,
      total: getTotalPrice(),
      timestamp: Date.now()
    }));
    
    // Переход на Kaspi QR
    window.location.href = KASPI_QR_URL;
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
    
    setTimeout(() => {
      setProcessingStep('success');
      localStorage.removeItem('cart');
      setCartItems([]);
      
      setTimeout(() => {
        setShowPaymentModal(false);
        router.push('/orders');
      }, 2000);
    }, 2000);
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Корзина пуста</h1>
          <p className="text-gray-500 mb-6">Добавьте товары, чтобы оформить заказ</p>
          <Link href="/offers">
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition">
              Перейти к покупкам
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header как в Kaspi - с кнопкой оплаты вверху */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-800">Корзина</h1>
            <div className="w-10"></div>
          </div>
          
          <div className="mb-4">
            <div className="text-2xl font-bold text-emerald-600">
              {getTotalPrice().toLocaleString()} ₸
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getTotalItems()} товара
            </div>
          </div>
          
          <button
            onClick={handleCheckout}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">💳</span>
            <span>Оформить заказ</span>
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
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-semibold text-sm min-w-[25px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-1 text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal - С ПЕРЕХОДОМ НА KASPI */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">💳</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Выберите способ оплаты</h2>
                <p className="text-gray-500">
                  Сумма: <span className="font-bold text-emerald-600 text-xl">{getTotalPrice()} ₸</span>
                </p>
              </div>
              
              {/* KASPI QR - КНОПКА С ПЕРЕХОДОМ ПО ССЫЛКЕ */}
              <button
                onClick={handleKaspiPayment}
                className="w-full p-5 rounded-2xl border-2 border-[#EA0033] bg-[#EA0033]/5 mb-4 transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#EA0033] rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">K</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-lg">Kaspi QR</h3>
                    <p className="text-sm text-gray-500">Оплата через Kaspi.kz</p>
                  </div>
                  <span className="text-2xl">→</span>
                </div>
              </button>

              {/* Другие способы оплаты (демо) */}
              <details className="mt-2">
                <summary className="text-center text-sm text-gray-400 cursor-pointer py-2">
                  💳 Другие способы оплаты (демо)
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
                          paymentMethod === method 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-gray-200 hover:border-gray-300'
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Номер карты</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
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
                      <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                        ⚠️ {paymentError}
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                      >
                        Назад
                      </button>
                      <button
                        onClick={processPayment}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                      >
                        Оплатить (демо)
                      </button>
                    </div>
                  </div>
                </div>
              </details>

              <div className="mt-6 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-blue-700 text-center">
                  🔒 После нажатия вы перейдете в Kaspi.kz для подтверждения платежа
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}