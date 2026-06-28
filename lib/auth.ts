// lib/auth.ts

'use client';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Проверяем все возможные места хранения
  const token = 
    sessionStorage.getItem('userToken') ||
    sessionStorage.getItem('authToken') ||
    sessionStorage.getItem('courierToken') ||
    localStorage.getItem('userToken') ||
    localStorage.getItem('authToken') ||
    null;
  
  // Если токен найден, синхронизируем его во все места
  if (token) {
    syncToken(token);
  }
  
  return token;
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.setItem('userToken', token);
  sessionStorage.setItem('authToken', token);
  localStorage.setItem('userToken', token);
  localStorage.setItem('authToken', token);
};

export const syncToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  // Проверяем, где есть токен и синхронизируем
  const sessionToken = sessionStorage.getItem('userToken');
  const localToken = localStorage.getItem('userToken');
  
  if (token) {
    sessionStorage.setItem('userToken', token);
    sessionStorage.setItem('authToken', token);
    localStorage.setItem('userToken', token);
    localStorage.setItem('authToken', token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('courierToken');
  localStorage.removeItem('userToken');
  localStorage.removeItem('authToken');
};