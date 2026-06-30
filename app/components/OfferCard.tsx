'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Gift, Heart } from 'lucide-react';
import { getAuthToken } from '@/lib/auth';

interface SurpriseItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  icon?: string;
}

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
  businessType?: string;
}

const getImageByTitle = (title: string) => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('пицц') || lowerTitle.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('бургер') || lowerTitle.includes('burger')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('суши') || lowerTitle.includes('sushi') || lowerTitle.includes('ролл')) {
    return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('салат') || lowerTitle.includes('salad')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop';
  }
  if (lowerTitle.includes('десерт') || lowerTitle.includes('dessert') || lowerTitle.includes('торт')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop';
};

// ✅ ТИПЫ ЗАВЕДЕНИЙ (НА АНГЛИЙСКОМ)
const BUSINESS_TYPE_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  bakery: 'Bakery',
  cafe: 'Cafe',
  fastfood: 'Fast Food',
  supermarket: 'Supermarket',
  store: 'Store',
};

// ✅ ВСЕ ИКОНКИ
const getProductIcon = (name: string, iconFromApi?: string) => {
  if (iconFromApi) return iconFromApi;
  const lowerName = name.toLowerCase();
  
  const iconMap: Record<string, string> = {
    'пицц': '🍕', 'pizza': '🍕',
    'бургер': '🍔', 'burger': '🍔',
    'картошк': '🍟', 'fries': '🍟',
    'хот-дог': '🌭', 'hot dog': '🌭',
    'сэндвич': '🥪', 'sandwich': '🥪',
    'буррито': '🌯', 'burrito': '🌯',
    'шаурм': '🥙', 'shawarma': '🥙',
    'фалафель': '🧆', 'falafel': '🧆',
    'плов': '🥘', 'plov': '🥘',
    'суп': '🍲', 'soup': '🍲', 'борщ': '🍲',
    'салат': '🥗', 'salad': '🥗',
    'мясо': '🍖', 'meat': '🍖',
    'куриц': '🍗', 'chicken': '🍗', 'крилс': '🍗', 'wings': '🍗',
    'стейк': '🥩', 'steak': '🥩',
    'креветк': '🍤', 'shrimp': '🍤',
    'суши': '🍣', 'sushi': '🍣', 'ролл': '🍣', 'roll': '🍣',
    'бенто': '🍱', 'bento': '🍱',
    'карри': '🍛', 'curry': '🍛',
    'лапш': '🍜', 'noodle': '🍜',
    'паста': '🍝', 'pasta': '🍝',
    'пельмен': '🥟', 'dumpling': '🥟',
    'фондю': '🫕', 'fondue': '🫕',
    'сыр': '🧀', 'cheese': '🧀',
    'молоко': '🥛', 'milk': '🥛',
    'морожен': '🍦', 'ice cream': '🍦',
    'яйц': '🥚', 'egg': '🥚',
    'масло': '🧈', 'butter': '🧈',
    'блин': '🥞', 'pancake': '🥞',
    'вафл': '🧇', 'waffle': '🧇',
    'торт': '🍰', 'cake': '🍰',
    'кекс': '🧁', 'cupcake': '🧁',
    'пирог': '🥧', 'pie': '🥧',
    'печень': '🍪', 'cookie': '🍪',
    'пончик': '🍩', 'donut': '🍩',
    'шоколад': '🍫', 'chocolate': '🍫',
    'конфет': '🍬', 'candy': '🍬',
    'леденец': '🍭', 'lollipop': '🍭',
    'пудинг': '🍮', 'pudding': '🍮',
    'круассан': '🥐', 'croissant': '🥐',
    'багет': '🥖', 'baguette': '🥖',
    'хлеб': '🍞', 'bread': '🍞',
    'бублик': '🥯', 'bagel': '🥯',
    'лепешк': '🫓', 'flatbread': '🫓',
    'кофе': '☕', 'coffee': '☕',
    'чай': '🍵', 'tea': '🍵',
    'сок': '🧃', 'juice': '🧃',
    'напит': '🥤', 'drink': '🥤', 'кола': '🥤', 'coca': '🥤',
    'пиво': '🍺', 'beer': '🍺',
    'вино': '🍷', 'wine': '🍷',
    'виски': '🥃', 'whiskey': '🥃',
    'вода': '💧', 'water': '💧',
    'яблок': '🍎', 'apple': '🍎',
    'груш': '🍐', 'pear': '🍐',
    'апельсин': '🍊', 'orange': '🍊',
    'лимон': '🍋', 'lemon': '🍋',
    'банан': '🍌', 'banana': '🍌',
    'арбуз': '🍉', 'watermelon': '🍉',
    'виноград': '🍇', 'grape': '🍇',
    'клубник': '🍓', 'strawberry': '🍓',
    'персик': '🍑', 'peach': '🍑',
    'вишн': '🍒', 'cherry': '🍒',
    'ананас': '🍍', 'pineapple': '🍍',
    'манго': '🥭', 'mango': '🥭',
    'дын': '🍈', 'melon': '🍈',
    'киви': '🥝', 'kiwi': '🥝',
    'помидор': '🍅', 'tomato': '🍅',
    'огурец': '🥒', 'cucumber': '🥒',
    'перец': '🌶️', 'pepper': '🌶️',
    'морков': '🥕', 'carrot': '🥕',
    'чеснок': '🧄', 'garlic': '🧄',
    'лук': '🧅', 'onion': '🧅',
    'картофель': '🥔', 'potato': '🥔',
    'гриб': '🍄', 'mushroom': '🍄',
    'кукуруз': '🌽', 'corn': '🌽',
    'рыб': '🐟', 'fish': '🐟',
    'лобстер': '🦞', 'lobster': '🦞',
    'краб': '🦀', 'crab': '🦀',
    'осьминог': '🐙', 'octopus': '🐙',
    'кальмар': '🦑', 'squid': '🦑',
    'веник': '🧹', 'broom': '🧹',
    'корзин': '🧺', 'basket': '🧺',
    'губк': '🧽', 'sponge': '🧽',
    'ведр': '🪣', 'bucket': '🪣',
    'перчатк': '🧤', 'glove': '🧤',
    'носок': '🧦', 'sock': '🧦',
    'футболк': '👕', 't-shirt': '👕',
    'штаны': '👖', 'pants': '👖',
    'плать': '👗', 'dress': '👗',
    'кроссовк': '👟', 'sneaker': '👟',
    'чемодан': '🧳', 'suitcase': '🧳',
    'рюкзак': '🎒', 'backpack': '🎒',
    'сумк': '👜', 'bag': '👜',
    'кепк': '🧢', 'cap': '🧢',
    'игрушк': '🧸', 'toy': '🧸',
    'книг': '📚', 'book': '📚',
    'ресторан': '🍽️', 'restaurant': '🍽️',
  };
  
  for (const [key, emoji] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) return emoji;
  }
  
  return '🍽️';
};

export default function OfferCard({
  id,
  name: propName,
  businessName,
  distance,
  price: propPrice,
  originalPrice: propOriginalPrice,
  discount: propDiscount,
  imageUrl: propImageUrl,
  description: propDescription,
  onOrderSuccess,
  businessType
}: OfferCardProps) {
    console.log('🏷️ OfferCard получил businessType:', businessType);
  const router = useRouter();
  const pathname = usePathname();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [bagItems, setBagItems] = useState<SurpriseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  
  // ✅ СОСТОЯНИЯ ДЛЯ РЕЙТИНГА
  const [bagRating, setBagRating] = useState(0);
  const [bagTotalReviews, setBagTotalReviews] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const token = getAuthToken();

  // ✅ ЗАГРУЗКА РЕЙТИНГА
  useEffect(() => {
    const fetchRating = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`/api/surprise-bags/${id}/rating`, { headers });
        if (response.ok) {
          const data = await response.json();
          setBagRating(data.rating || 0);
          setBagTotalReviews(data.total_reviews || 0);
          setUserRating(data.user_rating || null);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };
    fetchRating();
  }, [id, token]);

  // ✅ ОТПРАВКА ОЦЕНКИ
  const submitRating = async (rating: number) => {
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    setIsRatingLoading(true);
    try {
      const response = await fetch(`/api/surprise-bags/${id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });

      const data = await response.json();
      
      if (response.ok) {
        setUserRating(rating);
        // Обновляем средний рейтинг
        const newTotal = bagTotalReviews + 1;
        const newRating = ((bagRating * bagTotalReviews) + rating) / newTotal;
        setBagRating(Math.round(newRating * 10) / 10);
        setBagTotalReviews(newTotal);
        showNotification('✅ Оценка сохранена!', 'success');
      } else {
        showNotification(data.detail || 'Ошибка при оценке', 'error');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      showNotification('Ошибка при оценке', 'error');
    } finally {
      setIsRatingLoading(false);
    }
  };

  // ✅ РЕНДЕР ЗВЕЗД (ОДНИ И ТЕ ЖЕ — И ДЛЯ ОТОБРАЖЕНИЯ, И ДЛЯ КЛИКА)
  const renderStars = () => {
    const stars = [];
    // Используем userRating если есть, иначе bagRating
    const displayRating = userRating || bagRating || 0;
    const hover = hoveredStar !== null ? hoveredStar : displayRating;
    const isInteractive = isAuthenticated && userRating === null && !isRatingLoading;
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.round(hover);
      const isActive = userRating !== null && i <= userRating;
      
      stars.push(
        <button
          key={i}
          onMouseEnter={() => isInteractive && setHoveredStar(i)}
          onMouseLeave={() => isInteractive && setHoveredStar(null)}
          onClick={() => isInteractive && submitRating(i)}
          disabled={!isInteractive}
          className={`text-[10px] transition-all duration-150 ${
            isFilled ? 'text-yellow-400' : 'text-gray-300'
          } ${isActive ? 'text-yellow-500' : ''} ${
            isInteractive ? 'cursor-pointer hover:scale-125' : 'cursor-default'
          }`}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        setIsAuthenticated(true);
        setAuthChecked(true);
        return;
      }
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        if (data.token) sessionStorage.setItem('userToken', data.token);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    checkAuth();
  }, [token]);

  useEffect(() => {
    const favorites = localStorage.getItem('favorites');
    if (favorites) {
      const favList = JSON.parse(favorites);
      setIsFavorite(favList.includes(id));
    }
  }, [id]);

  const fetchBagItems = async () => {
    if (bagItems.length > 0) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/surprise-bags/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBagItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching bag items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = async () => {
    if (!showExpanded && bagItems.length === 0) {
      await fetchBagItems();
    }
    setShowExpanded(!showExpanded);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favorites = localStorage.getItem('favorites');
    let favList: number[] = favorites ? JSON.parse(favorites) : [];
    if (isFavorite) {
      favList = favList.filter(favId => favId !== id);
    } else {
      favList.push(id);
    }
    localStorage.setItem('favorites', JSON.stringify(favList));
    setIsFavorite(!isFavorite);
  };

  const addToCart = async () => {
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }

    setAddingToCart(true);

    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bag_id: id, quantity: 1 })
      });

      const data = await response.json();

      if (response.status === 401) {
        alert('Сессия истекла. Пожалуйста, войдите заново.');
        router.push('/login');
        return;
      }

      if (response.ok && data.success) {
        const cart = JSON.parse(sessionStorage.getItem('cart') || '[]');
        const existing = cart.find((item: any) => item.id === id);
        
        const cartItem = {
          id, name: propName, businessName,
          price: propPrice, originalPrice: propOriginalPrice,
          discount: propDiscount, imageUrl: getImageByTitle(propName),
          quantity: 1, description: propDescription,
          totalItems: bagItems.length || 1,
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
        window.dispatchEvent(new Event('cartUpdated'));
        showNotification(`✅ ${propName} добавлен в корзину!`, 'success');
        if (onOrderSuccess) onOrderSuccess();
      } else {
        showNotification(data.detail || 'Ошибка при добавлении', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Ошибка соединения', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-4 right-4 z-50 p-2 rounded-xl text-white text-center animate-slide-up text-sm ${
      type === 'success' ? 'bg-[#367666]' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const formatPrice = (priceVal: number) => priceVal.toLocaleString('ru-KZ') + ' ₸';
  
  const getReviewText = (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'оценка';
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'оценки';
    return 'оценок';
  };

  if (!authChecked) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-32 bg-gray-200"></div>
        <div className="p-2">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalItems = bagItems.reduce((sum, item) => sum + item.quantity, 0) || 1;
  const businessTypeLabel = businessType ? BUSINESS_TYPE_LABELS[businessType] : null;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="relative h-32">
        <Image 
          src={propImageUrl || getImageByTitle(propName)} 
          alt={propName} 
          fill 
          className="object-cover"
        />
        
        <div className="absolute top-2 left-2 flex gap-1.5">
          {propDiscount > 0 && (
            <div className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm">
              -{propDiscount}%
            </div>
          )}
          <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center w-6 h-6">
            <Gift size={14} className="text-gray-800" />
          </div>
        </div>
        
        <button
          onClick={toggleFavorite}
          className="absolute top-2 right-2 z-10"
        >
          <Heart 
            size={16} 
            className={`transition ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400/70 hover:text-red-400'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
        
     <button 
  onClick={handleIconClick}
  className="p-1.5 hover:bg-gray-100 rounded transition"
>
  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
</button>
      </div>
      
      <div className="p-2">
        <Link href={`/supplier/${id}`}>
          <p className="font-bold text-[#367666] text-xs hover:text-[#2a5a4d] transition mb-0.5">
            {businessName}
            {businessTypeLabel && (
              <span className="font-normal text-gray-400 text-[10px] ml-1">
                , {businessTypeLabel}
              </span>
            )}
          </p>
        </Link>
        
        <h3 className="font-semibold text-gray-800 text-sm mb-0.5 line-clamp-1">
          {propName}
        </h3>
        
        {/* ✅ ОДИН РЯД ЗВЕЗД — И ДЛЯ ПОКАЗА, И ДЛЯ КЛИКА */}
        <div className="flex items-center gap-0.5 mt-0.5 mb-1 flex-wrap">
          <div className="flex items-center gap-0.5">
            {renderStars()}
            {bagTotalReviews > 0 && (
              <span className="text-[8px] text-gray-400">({bagTotalReviews})</span>
            )}
            {distance && (
              <span className="text-[8px] text-gray-400 ml-1">• {distance}</span>
            )}
          </div>
          {userRating !== null && (
            <span className="text-[8px] text-[#367666] font-medium ml-0.5">
              ✓
            </span>
          )}
        </div>
        
        {showExpanded && (
          <div className="mt-0.5 mb-0.5">
            {loading ? (
              <div className="flex justify-center py-1">
                <div className="w-2 h-2 border-2 border-[#367666] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : bagItems.length > 0 ? (
              <>
                <p className="text-[8px] font-semibold text-gray-700 mb-0.5">Состав:</p>
                {bagItems.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[8px] py-0.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]">{getProductIcon(item.name, item.icon)}</span>
                      <span className="text-gray-600 truncate max-w-[100px]">{item.name}</span>
                      <span className="text-gray-400 text-[7px]">×{item.quantity}</span>
                    </div>
                    <span className="font-medium text-[9px] text-[#367666]">
                      {(item.price * item.quantity).toLocaleString()} ₸
                    </span>
                  </div>
                ))}
                {bagItems.length > 3 && (
                  <p className="text-[7px] text-gray-400 text-center pt-0.5">
                    +{bagItems.length - 3} еще
                  </p>
                )}
              </>
            ) : (
              <p className="text-[8px] text-gray-400 text-center py-1">Нет информации</p>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100">
          <div>
            <span className="text-base font-bold text-[#367666]">{formatPrice(propPrice)}</span>
            {propOriginalPrice > propPrice && (
              <span className="text-gray-400 line-through text-[10px] ml-0.5">{formatPrice(propOriginalPrice)}</span>
            )}
          </div>
          
          <button
            onClick={addToCart}
            disabled={addingToCart}
            className="bg-[#367666] text-white px-12 py-1.5 rounded-lg text-base font-semibold hover:bg-[#2a5a4d] disabled:opacity-50 transition"
          >
            {addingToCart ? (
              <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Заказать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}