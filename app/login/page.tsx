'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')  // ← ДОБАВИТЬ ЭТО!
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('https://toogood-2ncf.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }), // ← ИСПОЛЬЗОВАТЬ password
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Неверный номер телефона или пароль')
      }
    } catch (err) {
      setError('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-sm">
        <h1 className="text-2xl font-bold text-emerald-600 text-center mb-6">Sarqyn Food</h1>
        <h2 className="text-xl font-semibold text-center mb-6">Кіру</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <input
            type="tel"
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:border-emerald-500"
            required
          />
          <input
            type="password"
            placeholder="Құпия сөз"
            value={password}  // ← ДОБАВИТЬ ЭТО!
            onChange={(e) => setPassword(e.target.value)}  // ← ДОБАВИТЬ ЭТО!
            className="w-full p-3 border border-gray-300 rounded-xl mb-6 focus:outline-none focus:border-emerald-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? 'Кіру...' : 'Кіру'}
          </button>
        </form>
        
        <p className="text-center text-gray-500 mt-6">
          Есеп жоқ па?{' '}
          <Link href="/signup" className="text-emerald-600">
            Тіркелу
          </Link>
        </p>
      </div>
    </div>
  )
}