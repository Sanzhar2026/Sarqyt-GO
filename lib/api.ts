// lib/api.ts
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://toogood-2ncf.onrender.com'

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
  name: string           // ← ADD THIS
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
  is_active?: boolean; 
}

// Order interface
export interface Order {
  id: number
  order_number: string
  bag_name: string
  surprise_bag_name?: string  // ← Added this optional property
  supplier_name: string
  amount_paid: number
  status: string
  created_at: string
  customer_address?: string
}

// Alias for Supplier (same interface, different name if needed)
export type NearbySupplier = Supplier

// Get bag by ID (for offers/[id] page)
export async function getBagById(id: number): Promise<SurpriseBag> {
  const response = await fetch(`${API_BASE}/api/suppliers/bag/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch bag: ${response.status}`)
  }
  return response.json()
}

export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('access_token')
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

export async function logout(): Promise<void> {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

// Get nearby suppliers (for homepage)
export async function getNearbyBags(
  lat: number, 
  lon: number, 
  radius: number = 10
): Promise<Supplier[]> {
  const response = await fetch(
    `${API_BASE}/api/suppliers/nearby?lat=${lat}&lon=${lon}&radius=${radius}`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch nearby bags: ${response.status}`)
  }
  const data = await response.json()
  return data.suppliers
}

// Create order
export async function createOrder(
  bagId: number,
  lat: number,
  lon: number,
  address: string
): Promise<{ order_id: number; order_number: string; status: string }> {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

// Get order by ID
export async function getOrder(orderId: number): Promise<any> {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`)
  }
  return response.json()
}

// ============ NEW FUNCTIONS ADDED ============

// Get all orders for current user
export async function getUserOrders(): Promise<Order[]> {
  const token = localStorage.getItem('access_token')
  
  const response = await fetch(`${API_BASE}/api/my-orders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`)
  }
  
  const data = await response.json()
  return data.orders || []
}

// Get order by ID with full details
export async function getOrderById(orderId: number): Promise<Order> {
  const token = localStorage.getItem('access_token')
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`)
  }
  
  return response.json()
}

// Get all orders (for admin/supplier)
export async function getAllOrders(): Promise<Order[]> {
  const token = localStorage.getItem('access_token')
  
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`)
  }
  
  const data = await response.json()
  return data.orders || data
}

// Update order status (for supplier/admin)
export async function updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean }> {
  const token = localStorage.getItem('access_token')
  
  const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })
  
  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.status}`)
  }
  
  return response.json()
}

// Login function
export async function login(email: string, password: string): Promise<{ success: boolean; user: User; access_token?: string }> {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })
  
  const data = await response.json()
  
  if (response.ok && data.success) {
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token)
    }
    localStorage.setItem('user', JSON.stringify(data.user))
    return { success: true, user: data.user, access_token: data.access_token }
  }
  
  throw new Error(data.error || 'Invalid credentials')
}

// Register function
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
    credentials: 'include',
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed')
  }
  
  return data
}

// Get user by ID
export async function getUserById(userId: number): Promise<User> {
  const token = localStorage.getItem('access_token')
  
  const response = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`)
  }
  
  return response.json()
}