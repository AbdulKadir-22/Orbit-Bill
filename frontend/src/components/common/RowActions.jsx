import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/**
 * RowActions reusable dropdown menu
 * Provides Edit, Activate/Deactivate, and Delete (with ConfirmDialog)
 */
export const RowActions = ({
  onEdit,
  onToggleStatus,
  onDelete,
  isActive = true,
  itemName = 'item',
  deleteLoading = false,
  canManage = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!canManage) return null;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1.5 rounded-[8px] text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer focus:outline-none"
        aria-label="Actions menu"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1 w-44 bg-white rounded-[12px] shadow-xl border border-black/10 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150"
        >
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left cursor-pointer"
            >
              <Edit2 size={14} className="text-neutral-500" />
              <span>Edit</span>
            </button>
          )}

          {onToggleStatus && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onToggleStatus();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors text-left cursor-pointer"
            >
              {isActive ? (
                <>
                  <ToggleRight size={14} className="text-amber-600" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={14} className="text-emerald-600" />
                  <span>Activate</span>
                </>
              )}
            </button>
          )}

          {onDelete && (
            <>
              <div className="h-[1px] bg-black/5 my-1" />
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowConfirm(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={async () => {
          await onDelete();
          setShowConfirm(false);
        }}
        title={`Delete ${itemName}?`}
        description={`Are you sure you want to delete this ${itemName}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
