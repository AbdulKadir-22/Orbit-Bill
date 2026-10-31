import { Spinner } from './Spinner';

/**
 * Button primitive with variants, sizes, loading state with spinner, and trailing icons.
 * Follows design requirements:
 * - Primary button: solid black, white text, 10px radius
 * - Secondary: white with subtle border
 * - Ghost: transparent with hover fill
 * - Danger: red tint with hover state
 */
export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
  loading = false,
  disabled = false,
  trailingIcon: TrailingIcon,
  leadingIcon: LeadingIcon,
  className = '',
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-[8px]',
    md: 'px-4 py-2.5 text-sm rounded-[10px]',
    lg: 'px-5 py-3 text-base rounded-[12px]',
  }[size] || 'px-4 py-2.5 text-sm rounded-[10px]';

  const variantClasses = {
    primary:
      'bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 border border-transparent shadow-sm',
    secondary:
      'bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 border border-black/10 shadow-sm',
    ghost:
      'bg-transparent text-neutral-700 hover:bg-black/5 active:bg-black/10 border border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-transparent shadow-sm',
  }[variant] || 'bg-black text-white';

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size={size === 'sm' ? 'sm' : 'md'} />
          <span>{children}</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {LeadingIcon && <LeadingIcon size={16} />}
          <span>{children}</span>
          {TrailingIcon && <TrailingIcon size={16} />}
        </span>
      )}
    </button>
  );
};
