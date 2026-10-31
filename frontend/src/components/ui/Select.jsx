import { ChevronDown } from 'lucide-react';

/**
 * Select primitive
 * Styled dropdown select component.
 */
export const Select = ({
  label,
  hint,
  error,
  id,
  options = [],
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-neutral-700 flex items-center justify-between"
        >
          <span>{label}</span>
          {hint && <span className="text-[11px] text-neutral-400 font-normal">{hint}</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none bg-white text-neutral-900 text-sm rounded-[10px] border transition-all duration-150 py-2.5 pl-3.5 pr-10 outline-none cursor-pointer
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-black/10 hover:border-black/20 focus:border-black focus:ring-2 focus:ring-black/5'
            }
            ${disabled ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed opacity-75' : ''}
            ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 text-neutral-400 pointer-events-none flex items-center justify-center">
          <ChevronDown size={16} />
        </div>
      </div>

      {error && (
        <span role="alert" className="text-xs text-red-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
};
