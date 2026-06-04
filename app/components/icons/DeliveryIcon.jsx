// components/icons/DeliveryIcon.jsx
export function DeliveryIcon({ size = 48, className = "", onClick = null }) {
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
        <path d="M20 7L12 3L4 7L12 11L20 7Z"/>
        <path d="M4 7V17L12 21L20 17V7"/>
        <path d="M12 11V21"/>
        <path d="M9 4.5L15 8.5"/>
      </svg>
    </div>
  );
}