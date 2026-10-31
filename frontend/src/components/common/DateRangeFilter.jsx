import { useState } from 'react';
import { Calendar } from 'lucide-react';

/**
 * DateRangeFilter component
 * - From and To date inputs
 * - Quick presets: This month, Last 30 days, This year
 * - Emits { from, to } formatted as YYYY-MM-DD
 */
export const DateRangeFilter = ({ initialRange, onChange, className = '' }) => {
  const formatDateToIso = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPresets = () => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // This month (1st of month to today)
    const thisMonthStart = new Date(currentYear, now.getMonth(), 1);

    // Last 30 days
    const last30Start = new Date();
    last30Start.setDate(now.getDate() - 30);

    // This year (Jan 1 of current year to today)
    const thisYearStart = new Date(currentYear, 0, 1);

    return {
      'This month': {
        from: formatDateToIso(thisMonthStart),
        to: formatDateToIso(now),
      },
      'Last 30 days': {
        from: formatDateToIso(last30Start),
        to: formatDateToIso(now),
      },
      'This year': {
        from: formatDateToIso(thisYearStart),
        to: formatDateToIso(now),
      },
    };
  };

  const presets = getPresets();

  const [from, setFrom] = useState(initialRange?.from || presets['This year'].from);
  const [to, setTo] = useState(initialRange?.to || presets['This year'].to);

  const applyRange = (newFrom, newTo) => {
    setFrom(newFrom);
    setTo(newTo);
    if (onChange) {
      onChange({ from: newFrom, to: newTo });
    }
  };

  const handlePreset = (presetName) => {
    const range = presets[presetName];
    if (range) {
      applyRange(range.from, range.to);
    }
  };

  const handleFromChange = (e) => {
    const newFrom = e.target.value;
    setFrom(newFrom);
    if (onChange && newFrom && to) {
      onChange({ from: newFrom, to });
    }
  };

  const handleToChange = (e) => {
    const newTo = e.target.value;
    setTo(newTo);
    if (onChange && from && newTo) {
      onChange({ from, to: newTo });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Preset pills */}
      <div className="flex items-center space-x-1 bg-neutral-100 p-0.5 rounded-lg text-xs">
        {Object.keys(presets).map((name) => {
          const isSelected =
            from === presets[name].from && to === presets[name].to;
          return (
            <button
              key={name}
              type="button"
              onClick={() => handlePreset(name)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                isSelected
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Date Pickers */}
      <div className="flex items-center space-x-1.5 bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
        <Calendar size={13} className="text-neutral-400" />
        <input
          type="date"
          value={from}
          onChange={handleFromChange}
          className="text-xs text-neutral-700 font-medium focus:outline-none bg-transparent cursor-pointer"
        />
        <span className="text-neutral-300 font-normal">–</span>
        <input
          type="date"
          value={to}
          onChange={handleToChange}
          className="text-xs text-neutral-700 font-medium focus:outline-none bg-transparent cursor-pointer"
        />
      </div>
    </div>
  );
};
