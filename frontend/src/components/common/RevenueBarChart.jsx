import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

/**
 * RevenueBarChart component
 * - Monthly bars
 * - Monochrome palette: Latest month in black (#0b0b0b), others gray (#8a8a8a, #c4c4c4)
 * - Y axis formatted in K (e.g. 20K, 40K, 80K)
 *
 * @param {Array<{ month: string, revenue: number }>} data
 * @param {number} height
 */
export const RevenueBarChart = ({ data = [], height = 240 }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center text-sm text-neutral-400 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200"
      >
        No revenue data available
      </div>
    );
  }

  // Format month to short label if in YYYY-MM format, or use as is
  const formattedData = data.map((item, idx) => {
    let label = item.month;
    if (typeof item.month === 'string' && item.month.includes('-')) {
      const parts = item.month.split('-');
      if (parts.length >= 2) {
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        label = date.toLocaleString('default', { month: 'short' });
      }
    }
    return {
      ...item,
      label,
      isLatest: idx === data.length - 1,
    };
  });

  const formatYAxis = (val) => {
    if (val === 0) return '0';
    if (val >= 1000) return `${Math.round(val / 1000)}K`;
    return `${val}`;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
        >
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8a8a8a', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8a8a8a', fontSize: 11 }}
            tickFormatter={formatYAxis}
            dx={-4}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
            contentStyle={{
              backgroundColor: '#0b0b0b',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '12px',
              padding: '6px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            itemStyle={{ color: '#ffffff' }}
            labelStyle={{ color: '#a3a3a3', marginBottom: '2px', fontWeight: 500 }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {formattedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isLatest ? '#0b0b0b' : '#8a8a8a'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
