/**
 * Avatar primitive
 * Circle with the first letter of the name; picks a background color from a fixed palette by hashing the name.
 */

const AVATAR_PALETTE = [
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-neutral-800',
];

const hashStringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
};

export const Avatar = ({
  name = 'User',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
}) => {
  const initial = (name.trim()[0] || 'U').toUpperCase();
  const bgColor = hashStringToColor(name);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
  }[size] || 'w-8 h-8 text-xs font-semibold';

  return (
    <div
      className={`rounded-full ${bgColor} text-white flex items-center justify-center select-none shrink-0 shadow-sm ${sizeClasses} ${className}`}
      aria-label={name}
    >
      <span>{initial}</span>
    </div>
  );
};
