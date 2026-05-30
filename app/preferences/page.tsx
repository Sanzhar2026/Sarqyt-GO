import CategoryCard from '../components/CategoryCard';

const categories = [
  { name: 'American Food', emoji: '🍔' },
  { name: 'Italian Food', emoji: '🍕' },
  { name: 'Mexican Food', emoji: '🌮' },
  { name: 'Healthy Food', emoji: '🥗' },
  { name: 'Southern Food', emoji: '🍗' },
  { name: 'French Food', emoji: '🥐' },
];

export default function PreferencesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-600 text-white p-6">
        <h1 className="text-2xl font-bold">Vos préférences</h1>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.name} name={cat.name} emoji={cat.emoji} />
          ))}
        </div>
      </div>
    </div>
  );
}