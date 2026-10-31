import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';

/**
 * MultiSelect UI primitive
 * Searchable checkbox list returning an array of IDs.
 */
export const MultiSelect = ({
  label,
  hint,
  error,
  options = [], // [{ value: id, label: name, sublabel?: string }]
  value = [], // array of selected ids
  onChange,
  placeholder = 'Search items...',
  emptyMessage = 'No matching items found',
  maxHeight = 'max-h-48',
  className = '',
}) => {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(lower))
    );
  }, [options, query]);

  const toggleItem = (itemId) => {
    if (value.includes(itemId)) {
      onChange(value.filter((id) => id !== itemId));
    } else {
      onChange([...value, itemId]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full text-left ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-medium text-neutral-700">
          <span>{label}</span>
          <div className="flex items-center gap-2 text-[11px] font-normal text-neutral-500">
            <button
              type="button"
              onClick={selectAll}
              className="hover:text-black hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={clearAll}
              className="hover:text-black hover:underline cursor-pointer"
            >
              Clear
            </button>
            {hint && <span className="text-neutral-400">({hint})</span>}
          </div>
        </div>
      )}

      <div className="rounded-[10px] border border-black/10 bg-white overflow-hidden shadow-sm">
        {/* Search header inside container */}
        <div className="relative border-b border-black/5 p-2 bg-neutral-50/50">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white text-xs py-1.5 pl-8 pr-3 rounded-[6px] border border-black/10 focus:outline-none focus:border-black"
          />
        </div>

        {/* Options list */}
        <div className={`overflow-y-auto divide-y divide-black/[0.04] p-1 ${maxHeight}`}>
          {filteredOptions.length === 0 ? (
            <div className="p-4 text-xs text-center text-neutral-400">{emptyMessage}</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  onClick={() => toggleItem(opt.value)}
                  className={`flex items-center justify-between px-3 py-2 text-xs rounded-[6px] cursor-pointer transition-colors ${
                    isSelected ? 'bg-neutral-100 font-medium text-neutral-900' : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-neutral-400 font-normal">{opt.sublabel}</span>
                    )}
                  </div>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-black border-black text-white' : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
};
