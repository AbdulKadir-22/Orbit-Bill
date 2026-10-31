import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { STRINGS } from '../../constants/strings';

/**
 * EmptyState primitive
 * Renders consistent empty state illustrations with action button.
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = STRINGS.UI.EMPTY_DEFAULT_TITLE,
  description = STRINGS.UI.EMPTY_DEFAULT_DESC,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-black/10 rounded-[16px] bg-white/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
