'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface OfferCardProps {
  id: number;
  name: string;
  businessName: string;
  distance: string;
  price: number;
  originalPrice: number;
  discount: number;
  imageUrl: string;
  description?: string;
  onOrderSuccess?: () => void;
}

// 🍽️ КАТЕГОРИИ БЛЮД С ИЗОБРАЖЕНИЯМИ
const foodImages: Record<number, string> = {
  // Пиццы
  1: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop', // Маргарита
  2: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop', // Пепперони
  3: 'https://images.unsplash.com/photo-1541748829015-2884d51eea6b?w=400&h=300&fit=crop', // Гавайская
  4: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=400&h=300&fit=crop', // Мясная
  5: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&h=300&fit=crop', // Вегетарианская
  
  // Бургеры
  6: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', // Гамбургер
  7: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400&h=300&fit=crop', // Чизбургер
  8: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop', // Чикен бургер
  
  // Суши
  9: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop', // Суши сет
  10: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=400&h=300&fit=crop', // Филадельфия
  11: 'https://images.unsplash.com/photo-1617196034184-42c7c2e5d9b8?w=400&h=300&fit=crop', // Калифорния
  
  // Салаты
  12: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // Греческий
  13: 'https://images.unsplash.com/photo-1550304943-4f24f54dd8c9?w=400&h=300&fit=crop', // Цезарь
  
  // Напитки
  14: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop', // Кока-кола
  15: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop', // Лимонад
  
  // Десерты
  16: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // Чизкейк
  17: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop', // Тирамису
  
  // Закуски
  18: 'https://images.unsplash.com/photo-1630384060421-cf20c0e0e2a1?w=400&h=300&fit=crop', // Картошка фри
  19: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a3f58?w=400&h=300&fit=crop', // Куриные крылья
  20: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', // Сырные палочки
};

// 🏷️ НАЗВАНИЯ БЛЮД (для отображения)
const foodNames: Record<number, string> = {
  1: 'Маргарита пицца',
  2: 'Пепперони пицца',
  3: 'Гавайская пицца',
  4: 'Мясная пицца',
  5: 'Вегетарианская пицца',
  6: 'Гамбургер',
  7: 'Чизбургер',
  8: 'Чикен бургер',
  9: 'Суши сет',
  10: 'Филадельфия ролл',
  11: 'Калифорния ролл',
  12: 'Греческий салат',
  13: 'Цезарь салат',
  14: 'Кока-кола',
  15: 'Лимонад',
  16: 'Чизкейк',
  17: 'Тирамису',
  18: 'Картошка фри',
  19: 'Куриные крылья',
  20: 'Сырные палочки',
};

// 💰 ЦЕНЫ
const foodPrices: Record<number, number> = {
  1: 2500, 2: 3200, 3: 3000, 4: 3800, 5: 2800,
  6: 1800, 7: 2100, 8: 1900,
  9: 3000, 10: 4200, 11: 3800,
  12: 1500, 13: 2200,
  14: 500, 15: 800,
  16: 1200, 17: 1400,
  18: 800, 19: 1800, 20: 1500,
};

export default function OfferCard({
  id,
  name,
  businessName,
  distance,
  price,
  originalPrice,
  discount,
  imageUrl,
  description,
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string>('');

  const API_URL = 'https://toogood-2ncf.onrender.com';

  // Установка изображения на основе ID
  useEffect(() => {
    if (id && foodImages[id]) {
      setLocalImageUrl(foodImages[id]);
    } else {
      setLocalImageUrl(imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop');
    }
  }, [id, imageUrl]);

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

  const getCategoryImage = () => {
    if (localImageUrl) return localImageUrl;
    
    const lowerName = (name || foodNames[id] || '').toLowerCase();
    if (lowerName.includes('бургер')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop';
    if (lowerName.includes('пицца')) return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop';
    if (lowerName.includes('суши')) return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
  };

  const getDisplayName = () => {
    return name || foodNames[id] || 'Блюдо';
  };

  const getDisplayPrice = () => {
    return price || foodPrices[id] || 0;
  };

  const getDisplayOriginalPrice = () => {
    return originalPrice > price ? originalPrice : 0;
  };

  // Добавление в корзину с бронированием
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
        
        if (existing) {
          existing.quantity += 1;
          existing.reservation_id = data.reservation_id;
          existing.expires_at = data.expires_at;
        } else {
          cart.push({
            id,
            name: getDisplayName(),
            businessName,
            price: getDisplayPrice(),
            originalPrice: getDisplayOriginalPrice(),
            discount: discount || Math.round(((getDisplayOriginalPrice() - getDisplayPrice()) / getDisplayOriginalPrice()) * 100) || 0,
            imageUrl: getCategoryImage(),
            quantity: 1,
            description: description || getDisplayName(),
            reservation_id: data.reservation_id,
            expires_at: data.expires_at
          });
        }
        
        sessionStorage.setItem('cart', JSON.stringify(cart));
        alert(`✅ ${getDisplayName()} забронирован на 15 минут! Перейдите в корзину для оплаты.`);
        
        window.dispatchEvent(new Event('cartUpdated'));
        if (onOrderSuccess) onOrderSuccess();
        window.dispatchEvent(new CustomEvent('refreshOffers'));
        
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

  const displayName = getDisplayName();
  const displayPrice = getDisplayPrice();
  const displayOriginalPrice = getDisplayOriginalPrice();
  const displayDiscount = discount || (displayOriginalPrice > 0 ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) : 0);
  const displayImage = getCategoryImage();

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
      <Link href={`/offers/${id}`}>
        <div className="relative h-48">
          <Image 
            src={displayImage} 
            alt={displayName} 
            fill 
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {displayDiscount > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{displayDiscount}%
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link href={`/offers/${id}`}>
          <h3 className="font-bold text-lg mb-1 hover:text-emerald-600">{displayName}</h3>
        </Link>
        <p className="text-gray-500 text-sm mb-2">{businessName} • {distance}</p>
        {description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>}
        
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-2xl font-bold text-emerald-600">{displayPrice} ₸</span>
            {displayOriginalPrice > displayPrice && (
              <span className="text-gray-400 line-through text-sm ml-2">{displayOriginalPrice} ₸</span>
            )}
          </div>
          
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
  );
}