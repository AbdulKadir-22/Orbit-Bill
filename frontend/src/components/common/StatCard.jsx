import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '../ui/Card';

/**
 * StatCard component
 * Props:
 * - label: Card title/metric name
 * - value: Formatted value or number
 * - icon: Lucide icon component or element
 * - change: Optional percentage number (e.g. 12 or -14 or "+12%")
 * - changeText: Optional label under change (e.g. "vs previous period")
 * - isGoodTrend: Optional boolean to override positive/negative color
 */
export const StatCard = ({
  label,
  value,
  icon: Icon,
  change,
  changeText,
  isGoodTrend,
  className = '',
}) => {
  // Parse change value
  let numericChange = null;
  let formattedChange = null;

  if (change !== undefined && change !== null) {
    if (typeof change === 'number') {
      numericChange = change;
      formattedChange = `${change > 0 ? '+' : ''}${change}%`;
    } else if (typeof change === 'string') {
      formattedChange = change.startsWith('+') || change.startsWith('-') ? `${change}` : `+${change}`;
      numericChange = parseFloat(change.replace(/[^0-9.-]/g, ''));
    }
  }

  // Determine trend: default green for positive, red for negative.
  // Overdue/pending increases can be inverted if isGoodTrend is passed explicitly.
  const isPositive = numericChange !== null && numericChange >= 0;
  const isGood = isGoodTrend !== undefined ? isGoodTrend : isPositive;

  return (
    <Card className={`p-5 flex flex-col justify-between ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-2xl font-bold text-neutral-900 mt-2 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
            {typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null && '$$typeof' in Icon) ? (
              <Icon size={18} />
            ) : (
              Icon
            )}
          </div>
        )}
      </div>

      {(formattedChange !== null || changeText) && (
        <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center text-xs">
          {formattedChange !== null && (
            <span
              className={`inline-flex items-center font-medium mr-2 ${
                isGood ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositive ? (
                <ArrowUp size={13} className="mr-0.5 stroke-[2.5]" />
              ) : (
                <ArrowDown size={13} className="mr-0.5 stroke-[2.5]" />
              )}
              {formattedChange}
            </span>
          )}
          {changeText && (
            <span className="text-neutral-400">{changeText}</span>
          )}
        </div>
      )}
    </Card>
  );
};
