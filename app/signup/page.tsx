'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [step, setStep] = useState<'phone' | 'verify' | 'signup'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.startsWith('7') && digits.length === 11) {
      return `+${digits}`
    }
    if (digits.length === 10) {
      return `+77${digits}`
    }
    if (digits.startsWith('8') && digits.length === 11) {
      return `+7${digits.slice(1)}`
    }
    return value
  }

  // Step 1: Send SMS
  const sendVerification = async () => {
    if (!phone) {
      setError('Введите номер телефона')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formattedPhone = formatPhoneNumber(phone)
      const response = await fetch('https://toogood-2ncf.onrender.com/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: formattedPhone }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsDemoMode(data.demo || false)
        // ✅ AUTO-FILL THE CODE IN DEMO MODE
        if (data.demo) {
          setVerificationCode('123456')
        }
        setStep('verify')
      } else {
        setError(data.detail || 'Ошибка отправки SMS')
      }
    } catch (err) {
      setError('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify and signup
  const verifyAndSignup = async () => {
    // ✅ Don't require manual code entry in demo mode
    if (!isDemoMode && !verificationCode) {
      setError('Введите код подтверждения')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 4) {
      setError('Пароль должен быть не менее 4 символов')
      return
    }

    if (!fullName.trim()) {
      setError('Введите ваше имя')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formattedPhone = formatPhoneNumber(phone)
      
      // ✅ Always use 123456 if in demo mode
      const codeToSend = isDemoMode ? '123456' : verificationCode
      
      const response = await fetch('https://toogood-2ncf.onrender.com/api/verify-and-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          full_name: fullName,
          password: password,
          verification_code: codeToSend,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Auto-login after signup
        const loginResponse = await fetch('https://toogood-2ncf.onrender.com/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formattedPhone,
            password: password,
          }),
          credentials: 'include',
        })

        if (loginResponse.ok) {
          router.push('/')
          router.refresh()
        } else {
          router.push('/login')
        }
      } else {
        setError(data.detail || 'Ошибка регистрации')
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-600">Sarqyn Food</h1>
          <h2 className="text-xl font-semibold mt-4">Тіркелу</h2>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'phone' && 'Телефон нөміріңізді енгізіңіз'}
            {step === 'verify' && 'Тіркеу ақпаратын толтырыңыз'}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        {isDemoMode && step === 'verify' && (
          <div className="bg-green-100 text-green-700 p-3 rounded-xl mb-4 text-sm">
            ✅ Демо режим: Код автоматты түрде толтырылды
          </div>
        )}

        {step === 'phone' && (
          <div>
            <input
              type="tel"
              placeholder="Телефон (+77071234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={sendVerification}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Жіберілуде...' : 'Код жіберу'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div>
            {/* ✅ Hide code input in demo mode */}
            {!isDemoMode && (
              <input
                type="text"
                placeholder="SMS код"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:border-emerald-500"
              />
            )}
            
            <input
              type="text"
              placeholder="Толық аты-жөні"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:border-emerald-500"
            />
            
            <input
              type="password"
              placeholder="Құпия сөз"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:border-emerald-500"
            />
            
            <input
              type="password"
              placeholder="Құпия сөзді қайталаңыз"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl mb-6 focus:outline-none focus:border-emerald-500"
            />
            
            <button
              onClick={verifyAndSignup}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? 'Тіркелу...' : 'Тіркелу'}
            </button>
          </div>
        )}

        <p className="text-center text-gray-500 mt-6">
          Есеп бар ма?{' '}
          <Link href="/login" className="text-emerald-600">
            Кіру
          </Link>
        </p>
      </div>
    </div>
  )
}