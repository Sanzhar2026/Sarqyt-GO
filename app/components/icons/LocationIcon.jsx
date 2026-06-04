// components/icons/LocationIcon.jsx
export function LocationIcon({ size = 48, className = "", onClick = null }) {
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
      <svg 
        width={actualSize} 
        height={actualSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  );
}// components/icons/LocationIcon.jsx
export function LocationIcon({ size = 48, className = "", onClick = null }) {
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
      <svg 
        width={actualSize} 
        height={actualSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  );
}