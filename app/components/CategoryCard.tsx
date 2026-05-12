export default function CategoryCard({ 
  name, 
  emoji = "🍽️" 
}: { 
  name: string; 
  emoji?: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm active:scale-95 transition-transform cursor-pointer border border-gray-100">
      <div className="text-6xl mb-4">{emoji}</div>
      <h3 className="font-semibold text-lg leading-tight">{name}</h3>
      <p className="text-emerald-600 text-sm mt-1">+2400 offres</p>
    </div>
  );
}