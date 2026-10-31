import { useEffect } from 'react';
import { X } from 'lucide-react';
import { STRINGS } from '../../constants/strings';

/**
 * Modal primitive
 * Supports escape key closing, backdrop click, focus locking body scroll.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  footer,
  children,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`w-full ${maxWidth} bg-white rounded-[16px] border border-black/10 shadow-2xl p-6 z-10 relative flex flex-col gap-4 animate-in zoom-in-95 duration-150`}
      >
        {title && (
          <div className="flex items-start justify-between pb-3 border-b border-black/5">
            <div>
              <h3 id="modal-title" className="font-semibold text-lg text-neutral-900 tracking-tight">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[8px] text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer shrink-0 ml-2"
              aria-label={STRINGS.UI.CLOSE}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div className="pt-3 border-t border-black/5 mt-1">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
