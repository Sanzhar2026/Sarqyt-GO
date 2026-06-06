// app/components/OfferCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SurpriseItem {
  name: string;
  quantity: number;
  image: string;
}

interface SurprisePackage {
  id: number;
  name: string;
  description: string;
  image: string;
  items: SurpriseItem[];
  totalItems: number;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
}

// 🎁 СЮРПРИЗ-ПАКЕТЫ
const surprisePackages: SurprisePackage[] = [
  {
    id: 1,
    name: "🍕 Пицца-сет 'Итальянский ужин'",
    description: "Две большие пиццы для большой компании",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop",
    items: [
      { name: "Маргарита пицца", quantity: 1, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&h=150&fit=crop" },
      { name: "Пепперони пицца", quantity: 1, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=150&fit=crop" },
      { name: "Сырные палочки", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Кока-кола 0.5л", quantity: 2, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=150&fit=crop" }
    ],
    totalItems: 5,
    originalPrice: 8900,
    discountedPrice: 5900,
    discount: 34
  },
  {
    id: 2,
    name: "🍣 Суши-сет 'Самурай'",
    description: "Классический набор японской кухни",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
    items: [
      { name: "Филадельфия ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" },
      { name: "Калифорния ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034184-42c7c2e5d9b8?w=200&h=150&fit=crop" },
      { name: "Суши сет (24 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=150&fit=crop" },
      { name: "Имбирь/Васаби/Соевый соус", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" }
    ],
    totalItems: 41,
    originalPrice: 12500,
    discountedPrice: 8900,
    discount: 29
  },
  {
    id: 3,
    name: "🍔 Бургер-сет 'Американский'",
    description: "Три вида бургеров с картошкой и напитками",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    items: [
      { name: "Гамбургер", quantity: 1, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=150&fit=crop" },
      { name: "Чизбургер", quantity: 1, image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=200&h=150&fit=crop" },
      { name: "Чикен бургер", quantity: 1, image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=200&h=150&fit=crop" },
      { name: "Картошка фри", quantity: 2, image: "https://images.unsplash.com/photo-1630384060421-cf20c0e0e2a1?w=200&h=150&fit=crop" },
      { name: "Кока-кола 0.5л", quantity: 3, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=150&fit=crop" }
    ],
    totalItems: 8,
    originalPrice: 7500,
    discountedPrice: 4900,
    discount: 35
  },
  {
    id: 4,
    name: "🍰 Десерт-сет 'Сладкоежка'",
    description: "Для тех, кто любит сладкое",
    image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop",
    items: [
      { name: "Чизкейк", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Тирамису", quantity: 1, image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=200&h=150&fit=crop" },
      { name: "Макаруны (6 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=200&h=150&fit=crop" },
      { name: "Лимонад", quantity: 2, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&h=150&fit=crop" }
    ],
    totalItems: 10,
    originalPrice: 5800,
    discountedPrice: 3900,
    discount: 33
  },
  {
    id: 5,
    name: "🥗 ЗОЖ-сет 'Фитнес'",
    description: "Полезный набор для здорового питания",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    items: [
      { name: "Греческий салат", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Цезарь салат", quantity: 1, image: "https://images.unsplash.com/photo-1550304943-4f24f54dd8c9?w=200&h=150&fit=crop" },
      { name: "Куриные крылья (4 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a3f58?w=200&h=150&fit=crop" },
      { name: "Лимонад", quantity: 2, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&h=150&fit=crop" }
    ],
    totalItems: 5,
    originalPrice: 6800,
    discountedPrice: 4500,
    discount: 34
  },
  {
    id: 6,
    name: "🍕🍣 Микс-сет 'Азия & Италия'",
    description: "Сочетание итальянской и японской кухни",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop",
    items: [
      { name: "Маргарита пицца", quantity: 1, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&h=150&fit=crop" },
      { name: "Филадельфия ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" },
      { name: "Калифорния ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034184-42c7c2e5d9b8?w=200&h=150&fit=crop" },
      { name: "Картошка фри", quantity: 1, image: "https://images.unsplash.com/photo-1630384060421-cf20c0e0e2a1?w=200&h=150&fit=crop" }
    ],
    totalItems: 19,
    originalPrice: 11200,
    discountedPrice: 7900,
    discount: 29
  },
  {
    id: 7,
    name: "🎉 Семейный сет 'Для компании'",
    description: "Большой набор для вечеринки",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    items: [
      { name: "Маргарита пицца", quantity: 1, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&h=150&fit=crop" },
      { name: "Пепперони пицца", quantity: 1, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=150&fit=crop" },
      { name: "Гамбургер", quantity: 2, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=150&fit=crop" },
      { name: "Чизбургер", quantity: 2, image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=200&h=150&fit=crop" },
      { name: "Картошка фри", quantity: 3, image: "https://images.unsplash.com/photo-1630384060421-cf20c0e0e2a1?w=200&h=150&fit=crop" },
      { name: "Куриные крылья (6 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a3f58?w=200&h=150&fit=crop" },
      { name: "Кока-кола 0.5л", quantity: 4, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=150&fit=crop" }
    ],
    totalItems: 15,
    originalPrice: 15800,
    discountedPrice: 9900,
    discount: 37
  },
  {
    id: 8,
    name: "🍣🍰 Суши-десерт 'Азия & Сладкое'",
    description: "Суши + десерты для сладкоежек",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
    items: [
      { name: "Филадельфия ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" },
      { name: "Чизкейк", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Тирамису", quantity: 1, image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=200&h=150&fit=crop" },
      { name: "Макаруны (4 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=200&h=150&fit=crop" },
      { name: "Лимонад", quantity: 2, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&h=150&fit=crop" }
    ],
    totalItems: 14,
    originalPrice: 8900,
    discountedPrice: 5900,
    discount: 34
  }
];

interface OfferCardProps {
  id: number;
  businessName: string;
  distance: string;
  onOrderSuccess?: () => void;
}

export default function OfferCard({
  id,
  businessName,
  distance,
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Получаем данные сюрприз-пакета
  const surprise = surprisePackages.find(p => p.id === id) || surprisePackages[0];

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = sessionStorage.getItem('user');
      const token = sessionStorage.getItem('authToken');
      
      if (storedUser && token) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }
      
      try {
        const token = sessionStorage.getItem('authToken');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          headers
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          setIsAuthenticated(true);
          sessionStorage.setItem('user', JSON.stringify(data.user));
          if (data.token) sessionStorage.setItem('authToken', data.token);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [API_URL]);

  const addToCart = async () => {
    if (!isAuthenticated) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    setAddingToCart(true);
    const token = sessionStorage.getItem('authToken');

    try {
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ bag_id: id, quantity: 1 })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === id);
        
        const cartItem = {
          id: surprise.id,
          name: surprise.name,
          businessName,
          price: surprise.discountedPrice,
          originalPrice: surprise.originalPrice,
          discount: surprise.discount,
          imageUrl: surprise.image,
          quantity: 1,
          description: surprise.description,
          surpriseItems: surprise.items,
          totalItems: surprise.totalItems,
          reservation_id: data.reservation_id,
          expires_at: data.expires_at
        };
        
        if (existing) {
          existing.quantity += 1;
          existing.reservation_id = data.reservation_id;
          existing.expires_at = data.expires_at;
        } else {
          cart.push(cartItem);
        }
        
        sessionStorage.setItem('cart', JSON.stringify(cart));
        alert(`✅ ${surprise.name} забронирован на 15 минут!`);
        
        window.dispatchEvent(new Event('cartUpdated'));
        if (onOrderSuccess) onOrderSuccess();
        
      } else {
        alert(data.detail || '❌ Товар временно недоступен');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Ошибка соединения');
    } finally {
      setAddingToCart(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
      {/* Изображение с бейджами */}
      <div className="relative h-52 cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <Image 
          src={surprise.image} 
          alt={surprise.name} 
          fill 
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{surprise.discount}%
          </div>
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            🎁 {surprise.totalItems} предметов
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        {/* Название и ресторан */}
        <Link href={`/offers/${id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-emerald-600 transition line-clamp-1">
            {surprise.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 text-sm">{businessName}</p>
          <p className="text-gray-400 text-xs">📍 {distance}</p>
        </div>
        
        {/* Краткое описание */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{surprise.description}</p>
        
        {/* Детальный состав сюрприза */}
        {showDetails && (
          <div className="mt-3 mb-4 p-3 bg-gray-50 rounded-xl animate-fadeIn">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <span>🎁</span> В состав сюрприза входит:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {surprise.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">Количество: {item.quantity} шт.</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-emerald-600 font-medium">
                ✨ При отдельном заказе: {surprise.originalPrice.toLocaleString()} ₸
              </p>
              <p className="text-xs text-gray-500 mt-1">
                💰 Экономия: {surprise.discount}% ({Math.round(surprise.originalPrice - surprise.discountedPrice).toLocaleString()} ₸)
              </p>
            </div>
          </div>
        )}
        
        {/* Цена и кнопка */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-emerald-600">{surprise.discountedPrice.toLocaleString()} ₸</span>
            <span className="text-gray-400 line-through text-sm ml-2">{surprise.originalPrice.toLocaleString()} ₸</span>
            <p className="text-xs text-gray-400 mt-1">за весь набор</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-sm"
            >
              {showDetails ? 'Скрыть' : 'Состав'}
            </button>
            
            <button
              onClick={addToCart}
              disabled={addingToCart}
              className="bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Бронирование...</span>
                </>
              ) : (
                <>
                  <span>🛒</span>
                  <span>В корзину</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}