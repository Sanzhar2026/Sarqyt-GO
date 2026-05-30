// config/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  SURPRISE_BAGS: `${API_BASE_URL}/api/surprise-bags`,
  BOOKINGS_CREATE: `${API_BASE_URL}/api/bookings/create`,
  BOOKINGS_CHECK: (id: number) => `${API_BASE_URL}/api/bookings/check/${id}`,
  BOOKINGS_RELEASE: (id: number) => `${API_BASE_URL}/api/bookings/release/${id}`,
  CART_ADD: `${API_BASE_URL}/api/cart/add`,
  CART_GET: `${API_BASE_URL}/api/cart`,
  ORDERS_CREATE: `${API_BASE_URL}/api/orders`,
  ORDERS_MY: `${API_BASE_URL}/api/my-orders`,
};