'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationData {
  id: string;
  type: 'courier_arrived' | 'order_assigned' | 'delivery_confirmed';
  title: string;
  message: string;
  order_id?: number;
  order_number?: string;
  courier_name?: string;
  courier_phone?: string;
}

export default function GlobalNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const API_URL = 'https://toogood-2ncf.onrender.com';

  useEffect(() => {
    // Подключаемся к WebSocket при загрузке
    const websocket = new WebSocket('wss://toogood-2ncf.onrender.com/ws');
    
    websocket.onopen = () => {
      console.log('🌐 Global WebSocket connected');
    };
    
    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 Global WebSocket message:', data);
        
        // Обработка прибытия курьера
        if (data.type === 'courier_arrived') {
          const notification: NotificationData = {
            id: Date.now().toString(),
            type: 'courier_arrived',
            title: '🚚 Курьер прибыл!',
            message: `${data.data.courier_name} (${data.data.courier_phone}) ожидает вас с заказом #${data.data.order_number}`,
            order_id: data.data.order_id,
            order_number: data.data.order_number,
            courier_name: data.data.courier_name,
            courier_phone: data.data.courier_phone
          };
          setNotifications(prev => [notification, ...prev]);
          
          // Показываем браузерное уведомление
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚚 Курьер прибыл!', {
              body: `${data.data.courier_name} ожидает вас`,
              icon: '/logo.png'
            });
          }
        }
        
        // Обработка назначения курьера
        if (data.type === 'order_assigned') {
          const notification: NotificationData = {
            id: Date.now().toString(),
            type: 'order_assigned',
            title: '📦 Курьер назначен!',
            message: `${data.data.courier_name} (${data.data.courier_phone}) везет ваш заказ. Ожидайте ${data.data.estimated_time || 30} минут.`,
            order_id: data.data.order_id,
            courier_name: data.data.courier_name,
            courier_phone: data.data.courier_phone
          };
          setNotifications(prev => [notification, ...prev]);
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📦 Курьер назначен!', {
              body: `${data.data.courier_name} везет ваш заказ`,
              icon: '/logo.png'
            });
          }
        }
        
        // Обработка подтверждения доставки
        if (data.type === 'delivery_confirmed') {
          const notification: NotificationData = {
            id: Date.now().toString(),
            type: 'delivery_confirmed',
            title: '✅ Заказ доставлен!',
            message: `Заказ #${data.data.order_number} успешно доставлен. Спасибо!`,
            order_id: data.data.order_id,
            order_number: data.data.order_number
          };
          setNotifications(prev => [notification, ...prev]);
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.onclose = () => {
      console.log('Global WebSocket disconnected, reconnecting in 5s...');
      setTimeout(() => {
        const newWs = new WebSocket('wss://toogood-2ncf.onrender.com/ws');
        setWs(newWs);
      }, 5000);
    };
    
    setWs(websocket);
    
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: NotificationData) => {
    if (notification.order_id) {
      router.push(`/orders/${notification.order_id}`);
      removeNotification(notification.id);
    }
  };

  return (
    <>
      {/* Контейнер для уведомлений */}
      <div className="fixed top-16 right-4 left-4 z-50 space-y-2 max-w-md mx-auto md:right-8 md:left-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-2xl shadow-xl border-l-4 overflow-hidden animate-slide-in-right cursor-pointer
              ${notification.type === 'courier_arrived' ? 'border-green-500' : ''}
              ${notification.type === 'order_assigned' ? 'border-blue-500' : ''}
              ${notification.type === 'delivery_confirmed' ? 'border-emerald-500' : ''}
            `}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0
                  ${notification.type === 'courier_arrived' ? 'bg-green-100' : ''}
                  ${notification.type === 'order_assigned' ? 'bg-blue-100' : ''}
                  ${notification.type === 'delivery_confirmed' ? 'bg-emerald-100' : ''}
                `}>
                  {notification.type === 'courier_arrived' && '🚚'}
                  {notification.type === 'order_assigned' && '📦'}
                  {notification.type === 'delivery_confirmed' && '✅'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  {notification.courier_phone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${notification.courier_phone}`;
                      }}
                      className="mt-2 text-xs bg-gray-100 px-3 py-1 rounded-full text-emerald-600"
                    >
                      📞 Позвонить курьеру
                    </button>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Звук уведомления (опционально) */}
      <audio id="notification-sound" preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </>
  );
}