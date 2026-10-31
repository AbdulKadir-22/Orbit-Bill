import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { formatDate, formatCurrency } from '../../lib/utils';

/**
 * InvoiceDocument component (read-only)
 * Renders the complete invoice document:
 * - Header info card (Invoice No., Invoice Date, Due Date, Status, Billing Period)
 * - Customer card (Avatar, name, email, phone, address, GSTIN - empty fields hidden)
 * - Invoice Items table (# | Item with name + variant and muted description | Qty | Unit Price | Tax % | Tax Amount | Discount | Amount)
 * - Totals box (right-aligned: Subtotal, Tax, Discount (negative), Grand Total (bold), Amount Paid, Amount Due (bold, red if overdue))
 *   Also lists applied discount names if available.
 *
 * Reusable on Invoice Details and Phase 6 Customer Portal. No admin action buttons inside.
 */
export const InvoiceDocument = ({ invoice, className = '' }) => {
  if (!invoice) return null;

  const customer = invoice.customerId || {};
  const lines = invoice.lines || [];
  const billingPeriod = invoice.billingPeriod || {};

  // Format billing period string (e.g. "1 Nov 2024 – 30 Nov 2024")
  const formatPeriod = (period) => {
    if (!period || (!period.start && !period.end)) return '—';
    const startStr = period.start ? formatDate(period.start) : '';
    const endStr = period.end ? formatDate(period.end) : '';
    if (startStr && endStr) return `${startStr} – ${endStr}`;
    return startStr || endStr || '—';
  };

  // Format customer address (multiline)
  const formatAddress = (addr) => {
    if (!addr) return null;
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode || addr.zip,
      addr.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const addressString = formatAddress(customer.address);

  // Overdue calculation for Amount Due styling
  const isOverdue =
    invoice.status === 'overdue' ||
    invoice.isOverdue === true ||
    (invoice.status === 'confirmed' &&
      invoice.amountDue > 0 &&
      invoice.dueDate &&
      new Date(invoice.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0));

  // Applied discounts list
  const appliedDiscounts = invoice.appliedDiscountIds || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top 2 Cards: Invoice Information & Customer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Information Card */}
        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#a3a3a3] mb-4">
            Invoice Information
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
            <div>
              <div className="text-xs text-[#737373] mb-0.5">Invoice No.</div>
              <div className="font-mono font-semibold text-[#0b0b0b]">
                {invoice.invoiceNumber || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#737373] mb-0.5">Invoice Date</div>
              <div className="text-[#171717] font-medium">
                {formatDate(invoice.invoiceDate || invoice.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#737373] mb-0.5">Due Date</div>
              <div className="text-[#171717] font-medium">
                {formatDate(invoice.dueDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#737373] mb-0.5">Status</div>
              <div className="mt-0.5">
                <InvoiceStatusBadge invoice={invoice} />
              </div>
            </div>
            <div className="col-span-2 pt-2 border-t border-[#f0f0f0]">
              <div className="text-xs text-[#737373] mb-0.5">Billing Period</div>
              <div className="text-[#171717] font-medium text-xs font-mono">
                {formatPeriod(billingPeriod)}
              </div>
            </div>
          </div>
        </Card>

        {/* Customer Card */}
        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#a3a3a3] mb-4">
            Customer
          </h3>
          <div className="flex items-start gap-4">
            <Avatar name={customer.name || customer.company || 'Customer'} size="lg" />
            <div className="space-y-1.5 flex-1 min-w-0 text-sm">
              <div className="font-semibold text-[#0b0b0b] truncate">
                {customer.name || '—'}
              </div>
              {customer.company && (
                <div className="text-xs text-[#737373] font-medium">
                  {customer.company}
                </div>
              )}
              {customer.email && (
                <div className="text-xs text-[#525252] break-all">
                  <a href={`mailto:${customer.email}`} className="hover:underline">
                    {customer.email}
                  </a>
                </div>
              )}
              {customer.phone && (
                <div className="text-xs text-[#525252] font-mono">
                  {customer.phone}
                </div>
              )}
              {addressString && (
                <div className="text-xs text-[#525252] whitespace-pre-line pt-1 leading-relaxed">
                  {addressString}
                </div>
              )}
              {customer.gstin && (
                <div className="text-xs text-[#737373] pt-1">
                  GSTIN: <span className="font-mono font-medium text-[#171717]">{customer.gstin}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Items Card */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-semibold text-[#0b0b0b]">Invoice Items</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-xs font-semibold text-[#737373]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4 text-center w-20">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center w-20">Tax</th>
                <th className="py-3 px-4 text-right">Tax Amount</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-[#737373]">
                    No line items in this invoice.
                  </td>
                </tr>
              ) : (
                lines.map((line, idx) => (
                  <tr key={line._id || idx} className="hover:bg-[#fafafa]/60 transition-colors">
                    <td className="py-3.5 px-4 text-xs text-[#737373] font-mono text-center">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#0b0b0b]">
                        {line.productName || 'Item'}
                        {line.variantName && (
                          <span className="text-xs text-[#737373] ml-1.5 font-normal">
                            ({line.variantName})
                          </span>
                        )}
                      </div>
                      {line.description && (
                        <div className="text-xs text-[#737373] mt-0.5">
                          {line.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-sm text-[#171717]">
                      {line.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-[#525252]">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-[#525252]">
                      {line.taxRate ? `${line.taxRate}%` : '0%'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-[#525252]">
                      {formatCurrency(line.taxAmount || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-[#525252]">
                      {line.discountAmount ? formatCurrency(line.discountAmount) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#0b0b0b]">
                      {formatCurrency(line.lineTotal)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section (Right Aligned) */}
        <div className="p-6 border-t border-[#f0f0f0] bg-[#fafafa]/40 flex justify-end">
          <div className="w-full max-w-xs space-y-2.5 text-sm">
            <div className="flex justify-between text-[#737373]">
              <span>Subtotal</span>
              <span className="font-mono text-[#171717]">{formatCurrency(invoice.subtotal || 0)}</span>
            </div>

            <div className="flex justify-between text-[#737373]">
              <span>Tax</span>
              <span className="font-mono text-[#171717]">{formatCurrency(invoice.taxTotal || 0)}</span>
            </div>

            <div className="flex justify-between text-[#737373]">
              <span>Discount</span>
              <span className="font-mono text-[#171717]">
                {invoice.discountTotal > 0
                  ? `- ${formatCurrency(invoice.discountTotal)}`
                  : formatCurrency(0)}
              </span>
            </div>

            {/* Applied discount names */}
            {appliedDiscounts.length > 0 && (
              <div className="text-right text-[11px] text-[#737373] space-y-0.5">
                {appliedDiscounts.map((d, i) => (
                  <div key={d._id || i} className="italic">
                    Applied: {d.name || 'Discount'} ({d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)})
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-[#e5e5e5] flex justify-between font-bold text-base text-[#0b0b0b]">
              <span>Grand Total</span>
              <span className="font-mono">{formatCurrency(invoice.grandTotal || 0)}</span>
            </div>

            <div className="flex justify-between text-sm text-[#525252] pt-1">
              <span>Amount Paid</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.amountPaid || 0)}</span>
            </div>

            <div
              className={`flex justify-between text-base font-bold pt-1 ${
                isOverdue ? 'text-red-600' : 'text-[#0b0b0b]'
              }`}
            >
              <span>Amount Due</span>
              <span className="font-mono">{formatCurrency(invoice.amountDue ?? invoice.grandTotal ?? 0)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
