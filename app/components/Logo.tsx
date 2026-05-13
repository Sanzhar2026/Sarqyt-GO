// components/Logo.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const router = useRouter();
  
  const sizes = {
    small: { width: 30, height: 30, textSize: 'text-lg', gap: 'gap-1' },
    medium: { width: 40, height: 40, textSize: 'text-xl', gap: 'gap-2' },
    large: { width: 50, height: 50, textSize: 'text-2xl', gap: 'gap-3' },
  };

  const { width, height, textSize, gap } = sizes[size];

  const handleClick = () => {
    router.push('/');
  };

  return (
    <div onClick={handleClick} className={`flex items-center ${gap} cursor-pointer`}>
      <Image
        src="/icon.png"
        alt="Sarqyn Food Logo"
        width={width}
        height={height}
        className="rounded-full object-cover"
        priority
      />
      {showText && (
        <span className={`${textSize} font-bold text-white`}>Sarqyn Food</span>
      )}
    </div>
  );
}