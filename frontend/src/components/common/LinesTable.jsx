import { formatCurrency } from '../../lib/utils';

/**
 * LinesTable (read-only)
 * Columns: # | Product | Variant | Plan | Quantity | Unit Price | Tax (rate %) | Amount
 * Reused in Quotation details, Subscription details, and later phases.
 */
export const LinesTable = ({ lines = [] }) => {
  if (!lines || lines.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-[#737373]">
        No items in this list.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#e5e5e5] text-xs font-semibold text-[#737373] uppercase tracking-wider">
            <th className="py-3 px-3 w-12 text-center">#</th>
            <th className="py-3 px-3">Product</th>
            <th className="py-3 px-3">Variant</th>
            <th className="py-3 px-3">Plan</th>
            <th className="py-3 px-3 text-center">Quantity</th>
            <th className="py-3 px-3 text-right">Unit Price</th>
            <th className="py-3 px-3 text-right">Tax</th>
            <th className="py-3 px-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f0f0]">
          {lines.map((line, idx) => {
            const productName = line.productName || line.productId?.name || '—';
            const variantName = line.variantName || line.variantId?.name || '—';
            const planName = line.planName || line.planId?.name || '—';
            const quantity = line.quantity || 1;
            const unitPrice = line.unitPrice || 0;
            const taxRate = line.taxRate || 0;
            const amount = line.lineSubtotal ?? (quantity * unitPrice);

            return (
              <tr key={line._id || idx} className="hover:bg-[#fafafa] transition-colors">
                <td className="py-3 px-3 text-center text-[#737373] font-mono text-xs">{idx + 1}</td>
                <td className="py-3 px-3 font-medium text-[#171717]">{productName}</td>
                <td className="py-3 px-3 text-[#525252]">{variantName}</td>
                <td className="py-3 px-3 text-[#525252]">{planName}</td>
                <td className="py-3 px-3 text-center text-[#171717]">{quantity}</td>
                <td className="py-3 px-3 text-right font-mono text-[#525252]">{formatCurrency(unitPrice)}</td>
                <td className="py-3 px-3 text-right text-[#525252]">{taxRate}%</td>
                <td className="py-3 px-3 text-right font-medium font-mono text-[#171717]">{formatCurrency(amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
