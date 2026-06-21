// app/components/WebSocketListener.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function WebSocketListener() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem('userToken') || sessionStorage.getItem('authToken');
    
    if (!token) {
      console.log('⏭️ Нет токена, WebSocket не подключается');
      return;
    }

    const ws = new WebSocket(`wss://toogood-production.up.railway.app/ws?token=${encodeURIComponent(token)}`);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received:', data);
        
        // ✅ ОБРАБОТКА delivery_waiting_confirmation
        if (data.type === 'delivery_waiting_confirmation') {
          showToast(
            '📦 Подтвердите получение!',
            `${data.data.courier_name} передал вам заказ #${data.data.order_number}`,
            'warning'
          );
          setNotifications(prev => [data, ...prev]);
          
          if (data.data.order_id) {
            setTimeout(() => {
              if (confirm(`📦 Подтвердить получение заказа #${data.data.order_number}?`)) {
                router.push(`/orders/${data.data.order_id}`);
              }
            }, 1000);
          }
        }
        
        if (data.type === 'courier_arrived') {
          showToast('🚚 Курьер прибыл!', `${data.data.courier_name} ожидает вас`, 'info');
          setNotifications(prev => [data, ...prev]);
        }
        
        if (data.type === 'order_assigned') {
          showToast('✅ Курьер назначен!', `${data.data.courier_name} везет ваш заказ`, 'success');
          setNotifications(prev => [data, ...prev]);
        }
        
        if (data.type === 'delivery_confirmed' || data.type === 'delivery_confirmed_by_customer') {
          showToast('✅ Заказ доставлен!', 'Спасибо за заказ!', 'success');
          setNotifications(prev => [data, ...prev]);
        }
        
      } catch (error) {
        console.error('Ошибка парсинга:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
    };
    
    return () => ws.close();
  }, [router]);

  // Простой тост
  // ❌ Убираем TypeScript аннотацию : 'info'
  const showToast = (title, message, type = 'info') => {
    const colors = {
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      warning: 'bg-orange-500',
      info: 'bg-blue-500'
    };

    const toast = document.createElement('div');
    toast.className = `fixed top-20 left-4 right-4 z-50 p-4 rounded-xl text-white shadow-lg max-w-md mx-auto ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <div class="font-bold text-sm">${title}</div>
          <div class="text-sm opacity-90 mt-0.5">${message}</div>
        </div>
        <button class="text-white/70 hover:text-white text-lg" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  return null;
}