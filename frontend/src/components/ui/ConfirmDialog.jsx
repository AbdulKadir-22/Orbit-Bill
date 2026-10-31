import { Modal } from './Modal';
import { Button } from './Button';
import { STRINGS } from '../../constants/strings';

/**
 * ConfirmDialog primitive
 * Prompts user for destructive action confirmation.
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = STRINGS.UI.CONFIRM_DEFAULT_TITLE,
  description = STRINGS.UI.CONFIRM_DEFAULT_DESC,
  confirmText = STRINGS.UI.CONFIRM_OK,
  cancelText = STRINGS.UI.CONFIRM_CANCEL,
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
