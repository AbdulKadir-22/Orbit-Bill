/**
 * Card primitive
 * Pure presentation container: white background, subtle border, rounded-2xl, soft shadow.
 */
export const Card = ({
  children,
  className = '',
  onClick,
  interactive = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[16px] border border-black/[0.08] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] p-6 transition-all duration-200
        ${interactive ? 'cursor-pointer hover:border-black/20 hover:shadow-md' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
