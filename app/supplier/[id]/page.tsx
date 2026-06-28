'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

interface SurpriseBag {
  id: number;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url: string;
  available_quantity: number;
  pickup_start_time?: string;
  pickup_end_time?: string;
}

interface Supplier {
  id: number;
  business_name: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  cover_image?: string;
  logo?: string;
}

export default function SupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [bags, setBags] = useState<SurpriseBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false); // ✅ ФИКС ГИДРАТАЦИИ

  const supplierId = params?.id;

  // ✅ ФИКС ГИДРАТАЦИИ
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!supplierId) return;
      
      try {
        const [supplierRes, bagsRes] = await Promise.all([
          fetch(`/api/suppliers/${supplierId}`),
          fetch(`/api/suppliers/${supplierId}/surprise-bags`)
        ]);
        
        if (supplierRes.ok) {
          const supplierData = await supplierRes.json();
          setSupplier(supplierData);
        }
        
        if (bagsRes.ok) {
          const bagsData = await bagsRes.json();
          setBags(bagsData);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [supplierId]);

  const addToCart = async (bagId: number, bagName: string) => {
    const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('userToken');
    
    if (!token) {
      alert('Пожалуйста, войдите в аккаунт');
      router.push('/login');
      return;
    }
    
    setAddingToCart(bagId);
    
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bag_id: bagId, quantity: 1 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(`✅ ${bagName} добавлен в корзину!`, 'success');
        
        setBags(prev => prev.map(bag => 
          bag.id === bagId 
            ? { ...bag, available_quantity: bag.available_quantity - 1 }
            : bag
        ));
      } else {
        showNotification(data.detail || 'Ошибка при добавлении', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('Ошибка при добавлении в корзину', 'error');
    } finally {
      setAddingToCart(null);
    }
  };
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-4 right-4 z-50 p-4 rounded-xl text-white text-center animate-slide-up ${
      type === 'success' ? 'bg-[#367666]' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#367666] rounded-full"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Магазин не найден</p>
      </div>
    );
  }

  // ✅ ИСПОЛЬЗУЕМ isClient ДЛЯ URL С КЕШЕМ
  const logoUrl = isClient && supplier.logo 
    ? `${supplier.logo}?t=${Date.now()}` 
    : supplier.logo;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header с аватаркой */}
      <div className="bg-[#367666] text-white p-6">
        <button onClick={() => router.back()} className="mb-4 text-white hover:opacity-80 transition">
          ← Назад
        </button>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/50 flex-shrink-0">
            {supplier.logo ? (
              <img
                src={logoUrl || supplier.logo}
                alt={supplier.business_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('span');
                    fallback.className = 'text-2xl font-bold text-white';
                    fallback.textContent = supplier.business_name?.charAt(0)?.toUpperCase() || '?';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {supplier.business_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{supplier.business_name}</h1>
            <p className="text-sm opacity-90 mt-1">{supplier.address}</p>
            {supplier.rating && supplier.rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-300">★</span>
                <span>{supplier.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Список сюрпризов */}
      <div className="px-4 py-6">
        <h2 className="text-xl font-bold mb-4">Сюрпризы</h2>
        
        {bags.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🎁</div>
            <p className="text-gray-500">Нет доступных сюрпризов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bags.map((bag) => (
              <div key={bag.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex gap-4">
                  {bag.image_url && (
                    <div className="w-24 h-24 flex-shrink-0">
                      <img 
                        src={bag.image_url} 
                        alt={bag.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{bag.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{bag.description}</p>
                    
                    <div className="mt-2">
                      <span className="text-gray-400 line-through text-sm">{bag.original_price} ₸</span>
                      <span className="text-[#367666] font-bold text-xl ml-2">{bag.discounted_price} ₸</span>
                      <span className="text-xs text-gray-400 ml-1">-{bag.discount_percentage}%</span>
                    </div>
                    
                    <div className="mt-1">
                      <span className="text-xs text-gray-400">
                        Доступно: {bag.available_quantity} шт.
                      </span>
                    </div>
                    
                    <button
                      onClick={() => addToCart(bag.id, bag.name)}
                      disabled={bag.available_quantity <= 0 || addingToCart === bag.id}
                      className={`mt-3 w-full py-2 rounded-xl text-sm font-semibold transition ${
                        bag.available_quantity > 0
                          ? 'bg-[#367666] text-white hover:bg-[#2a5a4d]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {addingToCart === bag.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Заказ...
                        </span>
                      ) : bag.available_quantity > 0 ? (
                        'Заказать'
                      ) : (
                        'Нет в наличии'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}