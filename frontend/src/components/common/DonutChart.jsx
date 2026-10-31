import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

/**
 * DonutChart component
 * Props:
 * - data: Array<{ name: string, value: number, color?: string }>
 * - centerLabel: Label under the center total number (default: "Total")
 * - centerValue: Optional total number override (otherwise sums values)
 * - height: number (default: 240)
 */
export const DonutChart = ({
  data = [],
  centerLabel = 'Total',
  centerValue,
  height = 240,
}) => {
  const filteredData = data.filter((d) => d.value > 0);
  const total =
    centerValue !== undefined
      ? centerValue
      : data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  // Default monochrome palette: primary black, dark gray, medium gray, light gray; red for overdue
  const defaultColors = ['#0b0b0b', '#4a4a4a', '#8a8a8a', '#c4c4c4', '#e5e5e5'];

  const formattedData = data.map((item, index) => {
    let color = item.color;
    if (!color) {
      if (item.name.toLowerCase().includes('overdue')) {
        color = '#ef4444'; // Red for overdue
      } else {
        color = defaultColors[index % defaultColors.length];
      }
    }
    const pct = total > 0 ? Math.round(((Number(item.value) || 0) / total) * 100) : 0;
    return {
      ...item,
      color,
      pct,
    };
  });

  if (data.length === 0 || total === 0) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center text-sm text-neutral-400 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200"
      >
        No status data available
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4" style={{ height }}>
      {/* Donut Chart with Center Total */}
      <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData.length > 0 ? formattedData : [{ name: 'None', value: 1, color: '#e5e5e5' }]}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {formattedData.map((entry, index) => (
                <Cell key={`donut-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-neutral-900 tracking-tight leading-none">
            {total}
          </span>
          <span className="text-[11px] font-medium text-neutral-400 mt-1 uppercase tracking-wider">
            {centerLabel}
          </span>
        </div>
      </div>

      {/* Legend with count and percentage */}
      <div className="flex-1 w-full flex flex-col justify-center space-y-2.5 max-w-[200px]">
        {formattedData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-neutral-600 font-medium truncate max-w-[90px]">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-neutral-900">{item.value}</span>
              <span className="text-neutral-400 ml-1.5 font-normal">| {item.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
