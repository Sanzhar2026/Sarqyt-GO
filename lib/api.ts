// lib/api.ts - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ

import axios from 'axios'

// ============================================================
// ✅ ПРАВИЛЬНЫЙ URL БЕКЕНДА
// ============================================================
const API_BASE = 'https://toogood-production.up.railway.app'

// ============================================================
// ✅ ЭКСПОРТИРУЕМАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ТОКЕНА
// ============================================================
export const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('userToken') || 
           sessionStorage.getItem('authToken') || 
           localStorage.getItem('access_token') ||
           null;
};

// ============================================================
// ИНТЕРФЕЙСЫ
// ============================================================

export interface User {
  id: number
  email?: string
  phone: string
  full_name: string
  role: string
  is_active: boolean
}

export interface Props {
  key: number
  name: string
  businessName: string
  distance: string
  price: number
  originalPrice: number
  discount: number
  onClick: () => void
}

export interface Supplier {
  id: number
  business_name: string
  distance_km: number
  rating: number
  surprise_bags: SurpriseBag[]
}

export interface WebSocketMessage {
  type: 'new_bag' | 'update_bag' | 'delete_bag' | 'bag_quantity_updated'
  data?: {
    bag_id: number
    available_quantity: number
    is_active: boolean
    old_quantity?: number
  }
  timestamp?: string
}

export interface SurpriseBag {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  discount_percentage: number
  image_url: string
  supplier_name: string
  supplier_id: number
  available_quantity: number
  pickup_start_time?: string
  pickup_end_time?: string
  is_active?: boolean
}

// ============================================================
// ✅ ИСПРАВЛЕННЫЙ ИНТЕРФЕЙС ORDER - СООТВЕТСТВУЕТ API
// ============================================================
export interface Order {
  id: number
  order_number: string
  status: string
  created_at: string
  amount: number           // ← В API это amount
  courier_id: number | null
  address: string | null   // ← В API это address
  delivery_type: string    // ← В API это delivery_type
  
  // Дополнительные поля для совместимости (могут быть undefined)
  bag_name?: string
  surprise_bag_name?: string
  supplier_name?: string
  customer_address?: string
  amount_paid?: number
}

export type NearbySupplier = Supplier

// ============================================================
// API ФУНКЦИИ
// ============================================================

// Get bag by ID
export async function getBagById(id: number): Promise<SurpriseBag> {
  const response = await fetch(`${API_BASE}/api/suppliers/bag/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch bag: ${response.status}`)
  }
  return response.json()
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthToken()
  if (!token) return null
  
  try {
    const response = await fetch(`${API_BASE}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

// Logout
export async function logout(): Promise<void> {
  localStorage.removeItem('access_token')
  sessionStorage.removeItem('userToken')
  sessionStorage.removeItem('authToken')
  sessionStorage.removeItem('courierToken')
  sessionStorage.removeItem('user')
  window.location.href = '/login'
}

// Get nearby bags
export async function getNearbyBags(lat: number, lon: number, radius: number = 10): Promise<Supplier[]> {
  const response = await fetch(
    `${API_BASE}/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch nearby bags')
  }
  
  const data = await response.json()
  
  const filteredSuppliers = (data.suppliers || [])
    .map((supplier: any) => ({
      ...supplier,
      surprise_bags: (supplier.surprise_bags || []).filter((bag: any) => bag.available_quantity > 0)
    }))
    .filter((supplier: any) => supplier.surprise_bags.length > 0)
  
  return filteredSuppliers
}

// Create order
export async function createOrder(
  bagId: number,
  lat: number,
  lon: number,
  address: string
): Promise<{ order_id: number; order_number: string; status: string }> {
  const token = getAuthToken()
  
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
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create order: ${response.status} - ${error}`)
  }
  return response.json()
}

// Get order by ID (simple)
export async function getOrder(orderId: number): Promise<any> {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`)
  }
  return response.json()
}

// ============================================================
// ✅ GET USER ORDERS - ИСПРАВЛЕНО!
// ============================================================
export async function getUserOrders(): Promise<Order[]> {
  const token = getAuthToken()
  
  console.log('📍 API_BASE:', API_BASE)
  console.log('📍 URL:', `${API_BASE}/api/my-orders`)
  console.log('🔑 Токен:', token ? token.substring(0, 20) + '...' : 'Нет')
  
  const response = await fetch(`${API_BASE}/api/my-orders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Ошибка ответа:', response.status, errorText)
    throw new Error(`Failed to fetch orders: ${response.status} - ${errorText}`)
  }
  
  const data = await response.json()
  console.log('📦 Получены заказы:', data)
  
  // ✅ Возвращаем orders, даже если это массив
  if (Array.isArray(data)) {
    return data
  }
  
  return data.orders || []
}

// Get order by ID (full)
export async function getOrderById(orderId: number): Promise<Order> {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`)
  }
  
  return response.json()
}

// Get all orders (admin/supplier)
export async function getAllOrders(): Promise<Order[]> {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`)
  }
  
  const data = await response.json()
  return data.orders || data
}

// Update order status (admin/supplier)
export async function updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean }> {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({ status }),
  })
  
  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.status}`)
  }
  
  return response.json()
}

// Login
export async function login(email: string, password: string): Promise<{ success: boolean; user: User; access_token?: string }> {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  
  const data = await response.json()
  
  if (response.ok && data.success) {
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
      sessionStorage.setItem('userToken', data.access_token)
    }
    localStorage.setItem('user', JSON.stringify(data.user))
    sessionStorage.setItem('user', JSON.stringify(data.user))
    return { success: true, user: data.user, access_token: data.access_token }
  }
  
  throw new Error(data.error || 'Invalid credentials')
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
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed')
  }
  
  return data
}

// Get user by ID
export async function getUserById(userId: number): Promise<User> {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`)
  }
  
  return response.json()
}