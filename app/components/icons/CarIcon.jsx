// components/icons/CarIcon.jsx
import Image from 'next/image';

export function CarIcon({ size = 48, className = "", onClick = null }) {
  const sizes = {
    sm: 24,
    md: 40,
    lg: 48,
    xl: 64
  };
  
  const actualSize = typeof size === 'string' ? sizes[size] || 48 : size;
  
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Image 
        src="/car.jpg" 
        alt="Car" 
        width={actualSize} 
        height={actualSize}
        className="object-contain"
      />
    </div>
  );
}