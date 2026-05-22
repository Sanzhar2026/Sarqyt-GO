// lib/cart-api.ts - новый файл для работы с корзиной через API

const API_URL = 'https://toogood-2ncf.onrender.com';

export async function getCart() {
  const response = await fetch(`${API_URL}/api/cart`, {
    credentials: 'include'
  });
  return response.json();
}

export async function addToCart(bagId: number, quantity: number = 1) {
  const response = await fetch(`${API_URL}/api/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ bag_id: bagId, quantity })
  });
  return response.json();
}

export async function removeFromCart(bagId: number) {
  const response = await fetch(`${API_URL}/api/cart/remove/${bagId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return response.json();
}

export async function updateCartQuantity(bagId: number, quantity: number) {
  const response = await fetch(`${API_URL}/api/cart/update/${bagId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ quantity })
  });
  return response.json();
}

export async function createOrdersFromCart(lat: number, lon: number, address: string) {
  const response = await fetch(`${API_URL}/api/orders/create-from-cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ lat, lon, address })
  });
  return response.json();
}