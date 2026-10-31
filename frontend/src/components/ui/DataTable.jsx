import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

/**
 * DataTable primitive
 * Props-driven tabular presentation:
 * - columns: [{ header, accessor, render, className }]
 * - data: array of rows
 * - loading: boolean spinner overlay
 * - onRowClick: optional callback
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle,
  emptyDescription,
  onRowClick,
  rowKey = 'id',
  className = '',
}) => {
  return (
    <div
      className={`w-full overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-sm ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] bg-neutral-50/75">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Spinner size="lg" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const key = row[rowKey] || row._id || rowIndex;
                const isClickable = !!onRowClick;

                return (
                  <tr
                    key={key}
                    onClick={() => isClickable && onRowClick(row)}
                    className={`transition-colors duration-150 ${
                      isClickable
                        ? 'cursor-pointer hover:bg-neutral-50/80 active:bg-neutral-100/60'
                        : ''
                    }`}
                  >
                    {columns.map((col, colIndex) => {
                      const value = col.accessor ? row[col.accessor] : undefined;
                      const content = col.render ? col.render(row, rowIndex) : value;

                      return (
                        <td
                          key={colIndex}
                          className={`py-3.5 px-4 text-neutral-800 ${col.className || ''}`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
