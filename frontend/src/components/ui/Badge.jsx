/**
 * Badge primitive mapping statuses to design tokens:
 * - green = success / active
 * - amber = pending / paused
 * - red = overdue / failed / danger
 * - gray = closed / draft / neutral
 */
export const Badge = ({
  children,
  variant = 'neutral', // 'success' | 'pending' | 'danger' | 'neutral'
  size = 'md', // 'sm' | 'md'
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]',
    pending: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
    danger: 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]',
    neutral: 'bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]',
  }[variant] || 'bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]';

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  }[size] || 'text-xs px-2.5 py-1 rounded-full';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
