// components/CategoryCard.tsx
'use client';

type Props = {
  name: string;
  emoji?: string;
  isSelected?: boolean;
  onClick?: () => void;
  lang?: 'kz' | 'ru';
};

export default function CategoryCard({ 
  name, 
  emoji, 
  isSelected = false, 
  onClick, 
  lang = 'kz' 
}: Props) {
  const buttonText = lang === 'kz' ? 'Маған ұнайды' : 'Мне нравится';
  const buttonEmoji = '🔥';

  return (
    <div 
      onClick={onClick}
      className={`relative bg-white rounded-3xl overflow-hidden shadow-sm active:scale-[0.97] transition-all cursor-pointer border-2 ${isSelected ? 'border-emerald-500' : 'border-transparent'}`}
    >
      {/* Only emoji, no images */}
      <div className="h-44 flex items-center justify-center text-8xl bg-gradient-to-br from-emerald-50 to-emerald-100">
        {emoji || '🍽️'}
      </div>

      <div className="p-4 text-center">
        <h3 className="font-semibold text-lg">{name}</h3>
        
        <div className={`mt-3 mx-auto py-2.5 px-6 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 w-fit transition-all
          ${isSelected 
            ? 'bg-emerald-600 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <span>{buttonEmoji}</span>
          <span>{buttonText}</span>
        </div>
      </div>
    </div>
  );
}