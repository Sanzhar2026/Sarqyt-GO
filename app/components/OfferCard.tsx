// app/components/OfferCard.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ С ИКОНКАМИ

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Gift, Heart } from 'lucide-react';

interface SurpriseItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  icon?: string;  // ✅ ДОБАВЛЯЕМ icon
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

// ✅ ЗАПАСНАЯ ФУНКЦИЯ (ЕСЛИ ИКОНКА НЕ ПРИШЛА)
// app/components/OfferCard.tsx

const getProductIcon = (name: string, iconFromApi?: string) => {
  // Если есть иконка из API - используем её
  if (iconFromApi) return iconFromApi;
  
  const lowerName = name.toLowerCase();
  
  // ===== ЕДА =====
  if (lowerName.includes('пицц') || lowerName.includes('pizza')) return '🍕';
  if (lowerName.includes('бургер') || lowerName.includes('burger')) return '🍔';
  if (lowerName.includes('картошк') || lowerName.includes('fries') || lowerName.includes('фри')) return '🍟';
  if (lowerName.includes('хот-дог') || lowerName.includes('hot dog')) return '🌭';
  if (lowerName.includes('сэндвич') || lowerName.includes('sandwich')) return '🥪';
  if (lowerName.includes('буррито') || lowerName.includes('burrito')) return '🌯';
  if (lowerName.includes('шаурм') || lowerName.includes('shawarma')) return '🥙';
  if (lowerName.includes('фалафель') || lowerName.includes('falafel')) return '🧆';
  if (lowerName.includes('плов') || lowerName.includes('plov')) return '🥘';
  if (lowerName.includes('суп') || lowerName.includes('soup') || lowerName.includes('борщ')) return '🍲';
  if (lowerName.includes('салат') || lowerName.includes('salad')) return '🥗';
  if (lowerName.includes('мясо') || lowerName.includes('meat')) return '🍖';
  if (lowerName.includes('куриц') || lowerName.includes('chicken') || lowerName.includes('крилс') || lowerName.includes('wings')) return '🍗';
  if (lowerName.includes('стейк') || lowerName.includes('steak') || lowerName.includes('говядин')) return '🥩';
  if (lowerName.includes('креветк') || lowerName.includes('shrimp')) return '🍤';
  if (lowerName.includes('суши') || lowerName.includes('sushi') || lowerName.includes('ролл') || lowerName.includes('roll')) return '🍣';
  if (lowerName.includes('бенто') || lowerName.includes('bento')) return '🍱';
  if (lowerName.includes('карри') || lowerName.includes('curry')) return '🍛';
  if (lowerName.includes('лапш') || lowerName.includes('noodle')) return '🍜';
  if (lowerName.includes('паста') || lowerName.includes('pasta') || lowerName.includes('спагетти') || lowerName.includes('макарон')) return '🍝';
  if (lowerName.includes('пельмен') || lowerName.includes('dumpling')) return '🥟';
  if (lowerName.includes('фондю') || lowerName.includes('fondue')) return '🫕';
  
  // ===== МОЛОЧНЫЕ =====
  if (lowerName.includes('сыр') || lowerName.includes('cheese')) return '🧀';
  if (lowerName.includes('молоко') || lowerName.includes('milk')) return '🥛';
  if (lowerName.includes('морожен') || lowerName.includes('ice cream')) return '🍦';
  if (lowerName.includes('яйц') || lowerName.includes('egg')) return '🥚';
  if (lowerName.includes('масло') || lowerName.includes('butter')) return '🧈';
  if (lowerName.includes('блин') || lowerName.includes('pancake')) return '🥞';
  if (lowerName.includes('вафл') || lowerName.includes('waffle')) return '🧇';
  
  // ===== ВЫПЕЧКА =====
  if (lowerName.includes('торт') || lowerName.includes('cake')) return '🍰';
  if (lowerName.includes('кекс') || lowerName.includes('cupcake')) return '🧁';
  if (lowerName.includes('пирог') || lowerName.includes('pie')) return '🥧';
  if (lowerName.includes('печень') || lowerName.includes('cookie')) return '🍪';
  if (lowerName.includes('пончик') || lowerName.includes('donut')) return '🍩';
  if (lowerName.includes('шоколад') || lowerName.includes('chocolate')) return '🍫';
  if (lowerName.includes('конфет') || lowerName.includes('candy')) return '🍬';
  if (lowerName.includes('леденец') || lowerName.includes('lollipop')) return '🍭';
  if (lowerName.includes('пудинг') || lowerName.includes('pudding')) return '🍮';
  if (lowerName.includes('круассан') || lowerName.includes('croissant')) return '🥐';
  if (lowerName.includes('багет') || lowerName.includes('baguette')) return '🥖';
  if (lowerName.includes('хлеб') || lowerName.includes('bread')) return '🍞';
  if (lowerName.includes('бублик') || lowerName.includes('bagel')) return '🥯';
  if (lowerName.includes('лепешк') || lowerName.includes('flatbread')) return '🫓';
  
  // ===== НАПИТКИ =====
  if (lowerName.includes('кофе') || lowerName.includes('coffee') || lowerName.includes('капучино') || lowerName.includes('латте') || lowerName.includes('эспрессо')) return '☕';
  if (lowerName.includes('чай') || lowerName.includes('tea')) return '🍵';
  if (lowerName.includes('сок') || lowerName.includes('juice')) return '🧃';
  if (lowerName.includes('напит') || lowerName.includes('drink') || lowerName.includes('кола') || lowerName.includes('coca') || lowerName.includes('лимонад')) return '🥤';
  if (lowerName.includes('bubble tea')) return '🧋';
  if (lowerName.includes('мате') || lowerName.includes('mate')) return '🧉';
  if (lowerName.includes('пиво') || lowerName.includes('beer')) return '🍺';
  if (lowerName.includes('вино') || lowerName.includes('wine')) return '🍷';
  if (lowerName.includes('виски') || lowerName.includes('whiskey')) return '🥃';
  if (lowerName.includes('коктейль') || lowerName.includes('cocktail')) return '🍸';
  if (lowerName.includes('шампанск') || lowerName.includes('champagne')) return '🍾';
  if (lowerName.includes('вода') || lowerName.includes('water')) return '💧';
  
  // ===== ФРУКТЫ И ОВОЩИ =====
  if (lowerName.includes('яблок') || lowerName.includes('apple')) return '🍎';
  if (lowerName.includes('груш') || lowerName.includes('pear')) return '🍐';
  if (lowerName.includes('апельсин') || lowerName.includes('orange')) return '🍊';
  if (lowerName.includes('лимон') || lowerName.includes('lemon')) return '🍋';
  if (lowerName.includes('банан') || lowerName.includes('banana')) return '🍌';
  if (lowerName.includes('арбуз') || lowerName.includes('watermelon')) return '🍉';
  if (lowerName.includes('виноград') || lowerName.includes('grape')) return '🍇';
  if (lowerName.includes('клубник') || lowerName.includes('strawberry')) return '🍓';
  if (lowerName.includes('черник') || lowerName.includes('blueberry')) return '🫐';
  if (lowerName.includes('персик') || lowerName.includes('peach')) return '🍑';
  if (lowerName.includes('вишн') || lowerName.includes('cherry')) return '🍒';
  if (lowerName.includes('ананас') || lowerName.includes('pineapple')) return '🍍';
  if (lowerName.includes('манго') || lowerName.includes('mango')) return '🥭';
  if (lowerName.includes('дын') || lowerName.includes('melon')) return '🍈';
  if (lowerName.includes('киви') || lowerName.includes('kiwi')) return '🥝';
  if (lowerName.includes('помидор') || lowerName.includes('tomato')) return '🍅';
  if (lowerName.includes('салат') || lowerName.includes('lettuce')) return '🥬';
  if (lowerName.includes('огурец') || lowerName.includes('cucumber')) return '🥒';
  if (lowerName.includes('перец') || lowerName.includes('pepper')) return '🌶️';
  if (lowerName.includes('морков') || lowerName.includes('carrot')) return '🥕';
  if (lowerName.includes('чеснок') || lowerName.includes('garlic')) return '🧄';
  if (lowerName.includes('лук') || lowerName.includes('onion')) return '🧅';
  if (lowerName.includes('картофель') || lowerName.includes('potato')) return '🥔';
  if (lowerName.includes('гриб') || lowerName.includes('mushroom')) return '🍄';
  if (lowerName.includes('кукуруз') || lowerName.includes('corn')) return '🌽';
  
  // ===== РЫБА И МОРЕПРОДУКТЫ =====
  if (lowerName.includes('рыб') || lowerName.includes('fish') || lowerName.includes('лосос') || lowerName.includes('salmon') || lowerName.includes('семг')) return '🐟';
  if (lowerName.includes('лобстер') || lowerName.includes('lobster')) return '🦞';
  if (lowerName.includes('краб') || lowerName.includes('crab')) return '🦀';
  if (lowerName.includes('осьминог') || lowerName.includes('octopus')) return '🐙';
  if (lowerName.includes('кальмар') || lowerName.includes('squid')) return '🦑';
  
  // ===== ХОЗТОВАРЫ =====
  if (lowerName.includes('веник') || lowerName.includes('broom')) return '🧹';
  if (lowerName.includes('корзин') || lowerName.includes('basket')) return '🧺';
  if (lowerName.includes('губк') || lowerName.includes('sponge')) return '🧽';
  if (lowerName.includes('мыть') || lowerName.includes('clean')) return '🧴';
  if (lowerName.includes('нитк') || lowerName.includes('thread')) return '🧵';
  if (lowerName.includes('ведр') || lowerName.includes('bucket')) return '🪣';
  if (lowerName.includes('перчатк') || lowerName.includes('glove')) return '🧤';
  if (lowerName.includes('носок') || lowerName.includes('sock')) return '🧦';
  if (lowerName.includes('футболк') || lowerName.includes('t-shirt')) return '👕';
  if (lowerName.includes('штаны') || lowerName.includes('pants')) return '👖';
  if (lowerName.includes('плать') || lowerName.includes('dress')) return '👗';
  if (lowerName.includes('кроссовк') || lowerName.includes('sneaker')) return '👟';
  if (lowerName.includes('чемодан') || lowerName.includes('suitcase')) return '🧳';
  if (lowerName.includes('рюкзак') || lowerName.includes('backpack')) return '🎒';
  if (lowerName.includes('сумк') || lowerName.includes('bag')) return '👜';
  if (lowerName.includes('кепк') || lowerName.includes('cap')) return '🧢';
  if (lowerName.includes('игрушк') || lowerName.includes('toy')) return '🧸';
  if (lowerName.includes('книг') || lowerName.includes('book')) return '📚';
  
  // ===== УНИВЕРСАЛЬНЫЕ =====
  if (lowerName.includes('посылка') || lowerName.includes('package')) return '📦';
  if (lowerName.includes('корзин') || lowerName.includes('cart')) return '🛒';
  if (lowerName.includes('подарок') || lowerName.includes('gift')) return '🎁';
  if (lowerName.includes('магазин') || lowerName.includes('shop')) return '🏪';
  if (lowerName.includes('ресторан') || lowerName.includes('restaurant')) return '🍽️';
  
  // По умолчанию
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
  onOrderSuccess
}: OfferCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [addingToCart, setAddingToCart] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [bagItems, setBagItems] = useState<SurpriseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  
  const [bagRating, setBagRating] = useState(0);
  const [bagTotalReviews, setBagTotalReviews] = useState(0);

  
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('authToken') || 
           sessionStorage.getItem('courierToken') ||
           null;
  };

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const token = getAuthToken();
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`/api/surprise-bags/${id}/rating`, { headers });
        if (response.ok) {
          const data = await response.json();
          setBagRating(data.rating || 0);
          setBagTotalReviews(data.total_reviews || 0);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };
    fetchRating();
  }, [id]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
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
  }, []);

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
        // ✅ СОХРАНЯЕМ ТОВАРЫ С ИКОНКАМИ
        setBagItems(data.items || []);
        console.log('📦 Товары с иконками:', data.items);
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
    const token = getAuthToken();
    console.log('🔑 Токен в addToCart:', token ? 'Есть ✅' : 'Нет ❌');
    
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
      console.log('📡 Ответ /api/cart/add:', response.status, data);

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

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(bagRating);
    const hasHalfStar = bagRating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) stars.push(<span key={`full-${i}`} className="text-yellow-400 text-[10px]">★</span>);
    if (hasHalfStar) stars.push(<span key="half" className="text-yellow-400 text-[10px]">½</span>);
    for (let i = stars.length; i < 5; i++) stars.push(<span key={`empty-${i}`} className="text-gray-300 text-[10px]">★</span>);
    return stars;
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
          className="absolute bottom-2 right-2 z-10"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      <div className="p-2">
        <Link href={`/supplier/${id}`}>
          <p className="font-bold text-[#367666] text-xs hover:text-[#2a5a4d] transition mb-0.5">
            {businessName}
          </p>
        </Link>
        
        <h3 className="font-semibold text-gray-800 text-sm mb-0.5 line-clamp-1">
          {propName}
        </h3>
        
        <div className="text-gray-500 text-[9px] mb-0.5 leading-tight">
          {distance}
        </div>
        
        <div className="flex items-center gap-0.5 mt-0.5 mb-1">
          {renderStars()}
          {bagTotalReviews > 0 && <span className="text-[8px] text-gray-400">({bagTotalReviews})</span>}
        </div>
        
        {/* ✅ ОТОБРАЖЕНИЕ ТОВАРОВ С ИКОНКАМИ */}
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
                      {/* ✅ ИСПОЛЬЗУЕМ ИКОНКУ ИЗ API ИЛИ ЗАПАСНУЮ */}
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
            className="bg-[#367666] text-white px-12 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-[#2a5a4d] disabled:opacity-50 transition"
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