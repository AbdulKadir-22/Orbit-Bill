export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-surface-elevated text-ink',
    primary: 'bg-ink text-surface',
    outline: 'bg-transparent text-ink border-dashed',
  }[variant] || 'bg-surface-elevated text-ink';

  return (
    <span className={`brutal-badge inline-flex items-center gap-1 ${variantStyles} ${className}`}>
      {children}
    </span>
  );
};
