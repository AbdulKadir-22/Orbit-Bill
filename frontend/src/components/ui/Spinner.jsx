import { Loader2 } from 'lucide-react';

/**
 * Spinner primitive
 * @param {{ size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }} props
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 36,
  };

  const px = sizeMap[size] || 18;

  return (
    <Loader2
      size={px}
      className={`animate-spin text-current inline-block ${className}`}
      aria-label="Loading"
      role="status"
    />
  );
};
