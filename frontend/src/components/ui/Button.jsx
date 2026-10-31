export const Button = ({
  children,
  variant = 'secondary', // 'primary', 'secondary', 'danger', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size] || 'px-4 py-2 text-sm';

  const variantClasses = {
    primary: 'brutal-btn-primary',
    secondary: 'brutal-btn',
    danger: 'brutal-btn bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900',
    ghost: 'font-mono text-xs font-bold uppercase underline-offset-4 hover:underline text-ink cursor-pointer px-2 py-1',
  }[variant] || 'brutal-btn';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
