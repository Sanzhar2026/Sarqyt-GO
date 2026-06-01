// app/components/WebSocketListener.jsx или в любом компоненте
'use client';

import { useEffect, useState } from 'react';

export function WebSocketListener() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token'); // или sessionStorage
    const ws = new WebSocket(`wss://toogood-2ncf.onrender.com/ws?token=${token}`);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Received:', data);
      
      if (data.type === 'courier_arrived') {
        // Показываем уведомление пользователю
        alert(`🚚 Курьер ${data.data.courier_name} прибыл к вам!`);
        // Или используйте toast-уведомление
        showNotification(`Курьер прибыл!`, 'info');
        setNotifications(prev => [data, ...prev]);
      }
      
      if (data.type === 'order_assigned') {
        showNotification(`Ваш заказ принят курьером!`, 'success');
      }
      
      if (data.type === 'delivery_confirmed') {
        showNotification(`Заказ доставлен! Спасибо!`, 'success');
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...');
      setTimeout(() => {
        // реконнект
      }, 3000);
    };
    
    return () => ws.close();
  }, []);
  
  return null; // или верните UI для уведомлений
}