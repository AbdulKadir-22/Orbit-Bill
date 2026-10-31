import { useState, useId } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { STRINGS } from '../../constants/strings';

/**
 * Enhanced Input UI primitive
 * Supports labels, hints, validation errors, leading icons, password show/hide toggle, disabled/loading states.
 */
export const Input = ({
  label,
  hint,
  error,
  id,
  type = 'text',
  leadingIcon: LeadingIcon,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-neutral-700 flex items-center justify-between"
        >
          <span>{label}</span>
          {hint && (
            <span id={hintId} className="text-[11px] text-neutral-400 font-normal">
              {hint}
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {LeadingIcon && (
          <div className="absolute left-3.5 text-neutral-400 pointer-events-none flex items-center justify-center">
            <LeadingIcon size={16} />
          </div>
        )}

        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled || loading}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`w-full bg-white text-neutral-900 placeholder:text-neutral-400 text-sm rounded-[10px] border transition-all duration-150 py-2.5 outline-none
            ${LeadingIcon ? 'pl-10' : 'pl-3.5'}
            ${isPassword ? 'pr-10' : 'pr-3.5'}
            ${
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-black/10 hover:border-black/20 focus:border-black focus:ring-2 focus:ring-black/5'
            }
            ${disabled || loading ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed opacity-75' : ''}
            ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-neutral-400 hover:text-neutral-700 transition-colors p-1 cursor-pointer focus:outline-none"
            aria-label={showPassword ? STRINGS.UI.HIDE_PASSWORD : STRINGS.UI.SHOW_PASSWORD}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error && (
        <span
          id={errorId}
          role="alert"
          className="text-xs text-red-600 font-medium animate-in fade-in duration-150"
        >
          {error}
        </span>
      )}
    </div>
  );
};
