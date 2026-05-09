'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-green-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-green-600 text-white p-4 shadow-lg z-10">
        <h1 className="text-xl font-bold">🌱 Sarqyn Food</h1>
        <p className="text-sm opacity-90">Спасай еду со скидкой до 70%</p>
      </header>
      
      <main className="p-4">
        <div className="text-center py-12">
          <p className="text-gray-500">Привет! Твой фронтенд работает!</p>
          <p className="text-gray-500 text-sm mt-2">Скоро здесь будут сюрпризы из еды</p>
        </div>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 shadow-lg">
        <button className="flex flex-col items-center text-green-600">
          <span className="text-2xl">🏠</span>
          <span className="text-xs">Главная</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-2xl">📦</span>
          <span className="text-xs">Заказы</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <span className="text-2xl">👤</span>
          <span className="text-xs">Профиль</span>
        </button>
      </nav>
    </div>
  )
}