// app/signup/page.tsx
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Food Image */}
      <div className="h-64 bg-cover bg-center relative" 
           style={{ backgroundImage: "url('https://images.unsplash.com/photo-1565299623643-3f8b3e4d6e3f')" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
      </div>

      <div className="px-6 -mt-6 relative bg-white rounded-t-3xl pt-8">
        <h2 className="text-2xl font-bold text-center mb-8">Création compte</h2>

        <div className="space-y-4">
          <input type="text" placeholder="Prénom" className="w-full px-4 py-3 bg-gray-100 rounded-xl" />
          <input type="text" placeholder="Nom" className="w-full px-4 py-3 bg-gray-100 rounded-xl" />
          <input type="email" placeholder="exemple@email.com" className="w-full px-4 py-3 bg-gray-100 rounded-xl" />
          <input type="password" placeholder="Mot de passe" className="w-full px-4 py-3 bg-gray-100 rounded-xl" />
          <input type="password" placeholder="Confirmez votre mot de passe" className="w-full px-4 py-3 bg-gray-100 rounded-xl" />

          <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold mt-6">
            Connexion
          </button>
        </div>
      </div>
    </div>
  );
}