// app/page.tsx
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl">💚</span>
            </div>
            <h1 className="text-3xl font-bold text-emerald-600">Too Good To Go</h1>
          </div>
        </div>

        {/* Illustration */}
        <div className="flex justify-center mb-10">
          <div className="relative w-64 h-64">
            {/* Replace with your illustration or use SVG */}
            <div className="text-8xl">🛍️👩‍❤️‍👨</div>
          </div>
        </div>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="exemple@email.com"
            className="w-full px-4 py-3 bg-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full px-4 py-3 bg-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <p className="text-right text-emerald-600 text-sm cursor-pointer">
            Mot de passe oublié ?
          </p>

          <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold text-lg">
            Connexion
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Vous n'avez pas encore de compte ?{' '}
            <a href="/signup" className="text-emerald-600 font-semibold">
              créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}