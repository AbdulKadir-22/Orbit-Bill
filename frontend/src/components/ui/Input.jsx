export const Input = ({
  label,
  hint,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {label && (
        <label
          htmlFor={id}
          className="font-mono text-xs font-bold uppercase tracking-wider text-ink flex items-center justify-between"
        >
          <span>{label}</span>
          {hint && <span className="font-mono text-[10px] text-ink-muted font-normal lowercase">{hint}</span>}
        </label>
      )}
      <input
        id={id}
        className={`brutal-input px-3 py-2 text-sm text-ink placeholder:text-ink-faint w-full ${
          error ? 'border-red-600 dark:border-red-500 ring-1 ring-red-600' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="font-mono text-xs text-red-600 dark:text-red-400 font-semibold tracking-tight">
          ▲ {error}
        </span>
      )}
    </div>
  );
};
