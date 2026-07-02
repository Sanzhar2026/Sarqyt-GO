// lib/api.ts - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ

// ============================================================
// ✅ ПРАВИЛЬНЫЙ URL БЭКЕНДА
// ============================================================
const API_BASE = 'https://toogood-production.up.railway.app';

// ============================================================
// ✅ ЭКСПОРТИРУЕМАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ТОКЕНА
// ============================================================
export const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('authToken') || 
           localStorage.getItem('access_token') ||
           localStorage.getItem('userToken') ||
           null;
};

// ============================================================
// ИНТЕРФЕЙСЫ
// ============================================================

export interface User {
  id: number;
  email?: string;
  phone: string;
  full_name: string;
  role: string;
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

export interface Supplier {
  id: number;
  business_name: string;
  distance_km: number;
  rating: number;
  surprise_bags: SurpriseBag[];
  logo?: string;
  address?: string;
  lat?: number;
  lon?: number;
}

export interface SurpriseBag {
  id: number;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  image_url: string;
  supplier_name: string;
  supplier_id: number;
  available_quantity: number;
  pickup_start_time?: string;
  pickup_end_time?: string;
  is_active?: boolean;
  supplier_lat?: number;
  supplier_lon?: number;
}

// ============================================================
// ✅ ИНТЕРФЕЙС ORDER - РАСШИРЕННАЯ ВЕРСИЯ
// ============================================================
export interface Order {
  id: number;
  order_number: string;
  status: string;
  amount: number;
  amount_paid: number;
  bag_name?: string;
  surprise_bag_name?: string;
  supplier_name?: string;
  supplier_logo?: string;
  supplier?: {
    id: number;
    business_name: string;
    logo?: string;
    lat?: number;
    lon?: number;
    address?: string;
  };
  supplier_lat?: number;
  supplier_lon?: number;
  supplier_address?: string;
  customer_lat?: number;
  customer_lon?: number;
  customer_address?: string;
  address?: string;
  delivery_type?: string;
  delivery_deadline?: string;
  created_at: string;
  updated_at?: string;
  assigned_courier_id?: number;
  courier?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    car_model?: string;
    car_number?: string;
    rating?: number;
  };
}

export interface WebSocketMessage {
  type: 'new_bag' | 'update_bag' | 'delete_bag' | 'bag_quantity_updated' | 'order_status_updated' | 'courier_location';
  data?: {
    bag_id: number;
    available_quantity: number;
    is_active: boolean;
    old_quantity?: number;
    order_id?: number;
    new_status?: string;
    old_status?: string;
    lat?: number;
    lon?: number;
    courier_id?: number;
    courier_name?: string;
  };
  timestamp?: string;
}

export type NearbySupplier = Supplier;

// ============================================================
// API ФУНКЦИИ
// ============================================================

// Get bag by ID
export async function getBagById(id: number): Promise<SurpriseBag> {
  const response = await fetch(`${API_BASE}/api/suppliers/bag/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch bag: ${response.status}`);
  }
  return response.json();
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_BASE}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// Logout
export async function logout(): Promise<void> {
  localStorage.removeItem('access_token');
  localStorage.removeItem('userToken');
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('courierToken');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
}

// Get nearby bags
export async function getNearbyBags(lat: number, lon: number, radius: number = 10): Promise<Supplier[]> {
  const response = await fetch(
    `${API_BASE}/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch nearby bags');
  }
  
  const data = await response.json();
  
  const filteredSuppliers = (data.suppliers || [])
    .map((supplier: any) => ({
      ...supplier,
      surprise_bags: (supplier.surprise_bags || []).filter((bag: any) => bag.available_quantity > 0)
    }))
    .filter((supplier: any) => supplier.surprise_bags.length > 0);
  
  return filteredSuppliers;
}

// Create order
export async function createOrder(
  bagId: number,
  lat: number,
  lon: number,
  address: string
): Promise<{ order_id: number; order_number: string; status: string }> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({
      bag_id: bagId,
      lat: lat,
      lon: lon,
      address: address
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create order: ${response.status} - ${error}`);
  }
  return response.json();
}

// Get order by ID (simple)
export async function getOrder(orderId: number): Promise<any> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }
  return response.json();
}

// ============================================================
// ✅ GET USER ORDERS - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================================
export async function getUserOrders(): Promise<Order[]> {
  const token = getAuthToken();
  
  console.log('📍 API_BASE:', API_BASE);
  console.log('📍 URL:', `${API_BASE}/api/my-orders`);
  console.log('🔑 Токен:', token ? token.substring(0, 20) + '...' : 'Нет');
  
  if (!token) {
    console.error('❌ Нет токена!');
    throw new Error('No auth token');
  }
  
  const response = await fetch(`${API_BASE}/api/my-orders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Ошибка ответа:', response.status, errorText);
    throw new Error(`Failed to fetch orders: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('📦 Получены заказы:', data);
  
  if (Array.isArray(data)) {
    return data;
  }
  
  return data.orders || [];
}

// ============================================================
// ✅ GET ORDER BY ID - РАСШИРЕННАЯ ВЕРСИЯ
// ============================================================
export async function getOrderById(orderId: number): Promise<Order> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }
  
  const data = await response.json();
  
  // ✅ ПРЕОБРАЗУЕМ ДАННЫЕ В ЕДИНЫЙ ФОРМАТ
  return {
    ...data,
    supplier_logo: data.supplier_logo || data.supplier?.logo || null,
    supplier_lat: data.supplier_lat || data.supplier?.lat || null,
    supplier_lon: data.supplier_lon || data.supplier?.lon || null,
    supplier_address: data.supplier_address || data.supplier?.address || null,
    amount: data.amount || data.amount_paid || 0,
    amount_paid: data.amount_paid || data.amount || 0,
    address: data.address || data.customer_address || '',
    bag_name: data.bag_name || data.surprise_bag_name || ''
  };
}

// Get all orders (admin/supplier)
export async function getAllOrders(): Promise<Order[]> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`);
  }
  
  const data = await response.json();
  return data.orders || data;
}

// Update order status (admin/supplier)
export async function updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean }> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.status}`);
  }
  
  return response.json();
}

// Login
export async function login(email: string, password: string): Promise<{ success: boolean; user: User; access_token?: string }> {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('userToken', data.access_token);
    }
    localStorage.setItem('user', JSON.stringify(data.user));
    sessionStorage.setItem('user', JSON.stringify(data.user));
    return { success: true, user: data.user, access_token: data.access_token };
  }
  
  throw new Error(data.error || 'Invalid credentials');
}

// Register
export async function register(
  firstName: string, 
  lastName: string, 
  email: string, 
  password: string
): Promise<{ success: boolean; user_id: number; message: string }> {
  const response = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  
  return data;
}

// Get user by ID
export async function getUserById(userId: number): Promise<User> {
  const token = getAuthToken();
  
  const response = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  
  return response.json();
}

// lib/api.ts - ДОБАВИТЬ В КОНЕЦ ФАЙЛА

// ============================================================
// ✅ КУРЬЕР: СТАТУС
// ============================================================
export interface CourierStatus {
  is_verified: boolean;
  is_online: boolean;
  is_available: boolean;
  current_order_id?: number;
  courier_type?: string;
  rating?: number;
  total_deliveries?: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export async function getCourierStatus(): Promise<CourierStatus | null> {
  const token = getAuthToken();
  if (!token) {
    console.error('❌ Нет токена для получения статуса курьера');
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/api/courier/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('❌ Ошибка получения статуса курьера:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.success) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return null;
  }
}

// ============================================================
// ✅ КУРЬЕР: ВЫЙТИ НА ЛИНИЮ
// ============================================================
export async function courierGoOnline(lat: number, lon: number): Promise<{ success: boolean; message?: string }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: 'Нет токена' };
  }

  try {
    const response = await fetch(`${API_BASE}/api/courier/go-online`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lat, lon })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return { success: false, message: 'Ошибка соединения' };
  }
}

// ============================================================
// ✅ КУРЬЕР: УЙТИ С ЛИНИИ
// ============================================================
export async function courierGoOffline(): Promise<{ success: boolean; message?: string }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: 'Нет токена' };
  }

  try {
    const response = await fetch(`${API_BASE}/api/courier/go-offline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return { success: false, message: 'Ошибка соединения' };
  }
}

// ============================================================
// ✅ КУРЬЕР: ПОЛУЧИТЬ ДОСТУПНЫЕ ЗАКАЗЫ
// ============================================================
export interface AvailableOrder {
  order_id: number;
  order_number: string;
  amount: number;
  supplier_name: string;
  supplier_address: string;
  supplier_lat: number;
  supplier_lon: number;
  customer_address: string;
  customer_lat: number;
  customer_lon: number;
  bag_name: string;
  distance_km: number;
  delivery_type: string;
}

export async function getAvailableOrders(): Promise<AvailableOrder[]> {
  const token = getAuthToken();
  if (!token) {
    console.error('❌ Нет токена для получения заказов');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE}/api/courier/available-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('❌ Ошибка получения заказов:', response.status);
      return [];
    }

    const data = await response.json();
    if (data.success) {
      return data.orders || [];
    }
    return [];
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return [];
  }
}

// ============================================================
// ✅ КУРЬЕР: ВЗЯТЬ ЗАКАЗ
// ============================================================
export async function takeOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false, message: 'Нет токена' };
  }

  try {
    const response = await fetch(`${API_BASE}/api/courier/take-order/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return { success: false, message: 'Ошибка соединения' };
  }
}

// ============================================================
// ✅ КУРЬЕР: ОБНОВИТЬ ГЕОЛОКАЦИЮ
// ============================================================
export async function updateCourierLocation(lat: number, lon: number): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) {
    return { success: false };
  }

  try {
    const response = await fetch(`${API_BASE}/api/courier/update-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ lat, lon })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return { success: false };
  }
}

// ============================================================
// ✅ КУРЬЕР: ПОЛУЧИТЬ ИНФОРМАЦИЮ О ЗАКАЗЕ
// ============================================================
export async function getOrderForCourier(orderId: number): Promise<Order | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      ...data,
      supplier_logo: data.supplier_logo || data.supplier?.logo || null,
      supplier_lat: data.supplier_lat || data.supplier?.lat || null,
      supplier_lon: data.supplier_lon || data.supplier?.lon || null,
      supplier_address: data.supplier_address || data.supplier?.address || null,
      amount: data.amount || data.amount_paid || 0,
      amount_paid: data.amount_paid || data.amount || 0,
      address: data.address || data.customer_address || '',
      bag_name: data.bag_name || data.surprise_bag_name || ''
    };
  } catch (error) {
    console.error('❌ Ошибка:', error);
    return null;
  }
}