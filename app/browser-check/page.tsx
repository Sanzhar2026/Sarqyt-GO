// app/browser-check/page.tsx - ТОЛЬКО КНОПКА, БЕЗ ЗАДЕРЖЕК

'use client';

import { useState, useEffect } from 'react';

export default function BrowserCheckPage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  // ✅ ОТКРЫТЬ В БРАУЗЕРЕ
  const openInBrowser = () => {
    if (typeof window === 'undefined') return;
    
    // Получаем текущий URL
    const currentUrl = window.location.href;
    // Заменяем на главную страницу
    const homeUrl = currentUrl.replace('/browser-check', '/');
    
    // ✅ ПЫТАЕМСЯ ОТКРЫТЬ В БРАУЗЕРЕ
    // Создаем временную ссылку
    const link = document.createElement('a');
    link.href = homeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Пытаемся открыть
    try {
      link.click();
    } catch (e) {
      // Если не работает - копируем ссылку
      if (navigator.clipboard) {
        navigator.clipboard.writeText(homeUrl).then(() => {
          alert('✅ Ссылка скопирована! Откройте её в Safari или Chrome.');
        });
      } else {
        prompt('Скопируйте ссылку и откройте в браузере:', homeUrl);
      }
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#367666]">
        <div className="animate-spin h-12 w-12 border-b-2 border-white rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#367666] to-[#2a5a4d] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center">
          {/* Логотип */}
          <div className="w-24 h-24 mx-auto rounded-full bg-[#367666] flex items-center justify-center shadow-lg mb-6">
            <span className="text-3xl font-bold text-white">SG</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Откройте в браузере
          </h1>
          
          <p className="text-gray-500 text-sm mb-8">
            Встроенный браузер Instagram не поддерживает геолокацию
          </p>

          {/* ЕДИНСТВЕННАЯ КНОПКА - ОТКРЫТЬ В БРАУЗЕРЕ */}
          <button
            onClick={openInBrowser}
            className="w-full bg-[#367666] text-white py-4 rounded-2xl font-medium hover:bg-[#2a5a4d] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg text-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Открыть в браузере
          </button>

          {/* Иконка перехода */}
          <div className="mt-8 flex items-center justify-center gap-3 text-gray-300">
            <span className="text-3xl">📱</span>
            <span className="text-xl">→</span>
            <span className="text-3xl">🌐</span>
          </div>
        </div>
      </div>
    </div>
  );
}