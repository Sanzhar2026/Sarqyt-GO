// components/Logo.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  
  const sizes = {
    small: { width: 30, height: 30, textSize: 'text-lg', gap: 'gap-1', iconSize: 'text-xl' },
    medium: { width: 40, height: 40, textSize: 'text-xl', gap: 'gap-2', iconSize: 'text-2xl' },
    large: { width: 50, height: 50, textSize: 'text-2xl', gap: 'gap-3', iconSize: 'text-3xl' },
  };

  const { width, height, textSize, gap, iconSize } = sizes[size];

  const handleClick = () => {
    router.push('/');
  };

  return (
    <div onClick={handleClick} className={`flex items-center ${gap} cursor-pointer`}>
      {!imageError ? (
        <Image
          src="/icon.png"
          alt="Sarqyn Food Logo"
          width={width}
          height={height}
          className="rounded-full object-cover"
          priority
          onError={() => setImageError(true)}
        />
      ) : (
        // Fallback: эмодзи вместо изображения
        <div className={`${iconSize} rounded-full bg-emerald-700 flex items-center justify-center text-white`} 
             style={{ width, height }}>
          🍽️
        </div>
      )}
      {showText && (
        <span className={`${textSize} font-bold text-white`}>Sarqyn Food</span>
      )}
    </div>
  );
}