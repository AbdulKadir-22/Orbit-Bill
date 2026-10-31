import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Toast Provider and useToast hook
 * Displays floating notification pills at top/bottom right with auto-dismiss.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ message, type = 'info', duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    show: (message, options) => addToast({ message, ...options }),
    success: (message, options) => addToast({ message, type: 'success', ...options }),
    error: (message, options) => addToast({ message, type: 'error', ...options }),
    info: (message, options) => addToast({ message, type: 'info', ...options }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between gap-3 bg-neutral-900 text-white px-4 py-3 rounded-[12px] shadow-xl border border-white/10 text-sm animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-2.5">
              {item.type === 'success' && (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              )}
              {item.type === 'error' && (
                <AlertCircle size={18} className="text-rose-400 shrink-0" />
              )}
              {item.type === 'info' && (
                <Info size={18} className="text-neutral-400 shrink-0" />
              )}
              <span className="leading-snug">{item.message}</span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-0.5"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
