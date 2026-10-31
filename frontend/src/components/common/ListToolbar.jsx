import { Search, RotateCcw } from 'lucide-react';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

/**
 * ListToolbar reusable component
 * - Status tabs: All (n) / Active (n) / Inactive (n)
 * - Debounced search input
 * - Dynamic filter selects
 * - Reset button
 */
export const ListToolbar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  activeTab = 'all',
  onTabChange,
  counts,
  filters = [], // Array of { id, value, onChange, options, placeholder }
  onReset,
  showTabs = true,
  className = '',
}) => {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {/* Status Tabs if enabled */}
      {showTabs && (
        <div className="flex items-center gap-6 border-b border-black/10">
          {[
            { id: 'all', label: 'All', count: counts?.all },
            { id: 'active', label: 'Active', count: counts?.active },
            { id: 'inactive', label: 'Inactive', count: counts?.inactive },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const countLabel = tab.count !== undefined ? ` (${tab.count})` : '';
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer focus:outline-none ${
                  isActive
                    ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-[1px]'
                    : 'text-neutral-500 hover:text-neutral-800 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
                {countLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Filters Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white text-neutral-900 placeholder:text-neutral-400 text-sm rounded-[10px] border border-black/10 hover:border-black/20 focus:border-black focus:ring-2 focus:ring-black/5 py-2 pl-10 pr-3.5 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Filter Selects & Reset */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5">
          {filters.map((f) => (
            <div key={f.id} className="min-w-[130px] sm:w-auto">
              <Select
                id={`filter-${f.id}`}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                options={f.options}
                placeholder={f.placeholder}
                className="py-2 text-xs shadow-sm bg-white"
              />
            </div>
          ))}

          {onReset && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReset}
              leadingIcon={RotateCcw}
              className="py-2 px-3 text-xs shrink-0"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
