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