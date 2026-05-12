// app/payment/page.tsx
export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-emerald-600 text-white p-6 rounded-3xl mb-8">
          <h2 className="text-xl font-semibold">Enregistrez votre moyen de paiement</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full bg-black text-white py-4 rounded-2xl flex items-center justify-center gap-3 text-lg font-medium">
             Apple Pay
          </button>
          
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 text-lg font-medium">
            PayPal
          </button>

          <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl text-lg font-medium">
            Carte bancaire
          </button>
        </div>

        <label className="flex items-center gap-2 mt-8 text-gray-600">
          <input type="checkbox" className="w-5 h-5 accent-emerald-600" />
          Mémoriser mon paiement
        </label>

        <button className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white text-3xl mt-12 ml-auto">
          →
        </button>
      </div>
    </div>
  );
}