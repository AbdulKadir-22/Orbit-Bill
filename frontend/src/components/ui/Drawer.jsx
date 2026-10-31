import { useEffect } from 'react';
import { X } from 'lucide-react';
import { STRINGS } from '../../constants/strings';

/**
 * Drawer primitive
 * Slide-over sheet for mobile sidebars, details inspection, or edit panels.
 */
export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'left', // 'left' | 'right'
  maxWidth = 'max-w-xs',
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

  const isLeft = position === 'left';

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidth} bg-white h-full flex flex-col shadow-2xl transition-transform duration-200
          ${isLeft ? 'mr-auto animate-in slide-in-from-left' : 'ml-auto animate-in slide-in-from-right'}`}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-black/10">
            <h3 className="font-semibold text-base text-neutral-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[8px] text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label={STRINGS.UI.CLOSE}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
