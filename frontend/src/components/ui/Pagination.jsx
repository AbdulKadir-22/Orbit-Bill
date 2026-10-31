import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STRINGS } from '../../constants/strings';

/**
 * Pagination primitive
 * Controls page switching with previous / next actions.
 */
export const Pagination = ({
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between text-xs text-neutral-500 py-3 px-2 ${className}`}
    >
      <span>
        {STRINGS.UI.PAGINATION_PAGE} <strong className="text-neutral-800">{page}</strong>{' '}
        {STRINGS.UI.PAGINATION_OF}{' '}
        <strong className="text-neutral-800">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-[8px] border border-black/10 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-neutral-700"
          aria-label={STRINGS.UI.PAGINATION_PREV}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-[8px] border border-black/10 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-neutral-700"
          aria-label={STRINGS.UI.PAGINATION_NEXT}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
