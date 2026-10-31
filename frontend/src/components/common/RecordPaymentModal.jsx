import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { invoiceService } from '../../features/invoices/services/invoiceService';
import { paymentService } from '../../features/payments/services/paymentService';
import { PAYMENT_METHODS } from '../../constants/options';
import { formatCurrency } from '../../lib/utils';

/**
 * RecordPaymentModal component
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - invoice?: Object (optional fixed invoice if opened from details or a list row)
 * - onSaved?: (result) => void (callback after payment successfully recorded)
 */
export const RecordPaymentModal = ({
  isOpen,
  onClose,
  invoice: propInvoice,
  onSaved,
}) => {
  const { showSuccessToast, showErrorToast } = useToast();

  const [payableInvoices, setPayableInvoices] = useState([]);
  const [loadingPayables, setLoadingPayables] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [paidAt, setPaidAt] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize today's date in YYYY-MM-DD
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Determine current active invoice
  const currentInvoice = propInvoice || selectedInvoice;

  const loadPayableInvoices = useCallback(async () => {
    setLoadingPayables(true);
    try {
      const res = await invoiceService.list({ payable: true, limit: 100 });
      const list = res.data || [];
      setPayableInvoices(list);
      if (list.length > 0) {
        setSelectedInvoiceId(list[0]._id);
        setSelectedInvoice(list[0]);
        setAmount(String(list[0].amountDue ?? list[0].grandTotal ?? ''));
      }
    } catch (err) {
      showErrorToast(err?.message || 'Failed to load payable invoices');
    } finally {
      setLoadingPayables(false);
    }
  }, [showErrorToast]);

  // On open: setup defaults
  useEffect(() => {
    if (!isOpen) {
      setSelectedInvoiceId('');
      setSelectedInvoice(null);
      setAmount('');
      setMethod('bank_transfer');
      setPaidAt('');
      setReference('');
      setNotes('');
      return;
    }

    setPaidAt(getTodayDateString());

    if (propInvoice) {
      setSelectedInvoice(propInvoice);
      setSelectedInvoiceId(propInvoice._id);
      setAmount(String(propInvoice.amountDue ?? propInvoice.grandTotal ?? ''));
    } else {
      // Fetch payable invoices for the searchable select
      loadPayableInvoices();
    }
  }, [isOpen, propInvoice, loadPayableInvoices]);

  const handleInvoiceChange = (invId) => {
    setSelectedInvoiceId(invId);
    const found = payableInvoices.find((i) => i._id === invId);
    setSelectedInvoice(found || null);
    if (found) {
      setAmount(String(found.amountDue ?? found.grandTotal ?? ''));
    } else {
      setAmount('');
    }
  };

  const maxDue = currentInvoice ? (currentInvoice.amountDue ?? currentInvoice.grandTotal ?? 0) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const invId = propInvoice?._id || selectedInvoiceId;
    if (!invId) {
      showErrorToast('Please select an invoice');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showErrorToast('Payment amount must be greater than 0');
      return;
    }

    if (numAmount > maxDue) {
      showErrorToast(`Amount cannot exceed the amount due (${formatCurrency(maxDue)})`);
      return;
    }

    if (!method) {
      showErrorToast('Please select a payment method');
      return;
    }

    if (!paidAt) {
      showErrorToast('Please select a payment date');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoiceId: invId,
        amount: numAmount,
        method,
        paidAt: new Date(paidAt).toISOString(),
        reference: reference.trim(),
        notes: notes.trim(),
      };

      const result = await paymentService.record(payload);
      showSuccessToast('Payment recorded successfully');
      onClose();
      if (onSaved) onSaved(result);
    } catch (err) {
      showErrorToast(err?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      description="Record a payment receipt against an invoice."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Selection or Fixed Invoice Display */}
        {propInvoice ? (
          <div className="p-3.5 bg-[#f4f4f5]/60 rounded-lg border border-[#e4e4e7] space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373]">Invoice:</span>
              <span className="font-mono font-semibold text-[#0b0b0b]">
                {propInvoice.invoiceNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373]">Customer:</span>
              <span className="text-[#171717] font-medium truncate max-w-[200px]">
                {propInvoice.customerId?.name || propInvoice.customerId?.company || '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#737373]">Grand Total:</span>
              <span className="font-mono text-[#525252]">
                {formatCurrency(propInvoice.grandTotal || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#e4e4e7]">
              <span className="text-xs font-semibold text-[#0b0b0b]">Amount Due:</span>
              <span className="font-mono font-bold text-red-600">
                {formatCurrency(propInvoice.amountDue ?? propInvoice.grandTotal ?? 0)}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1.5">
              Invoice <span className="text-red-500">*</span>
            </label>
            {loadingPayables ? (
              <div className="flex items-center gap-2 text-xs text-[#737373] p-2 bg-[#f4f4f5] rounded-md">
                <Spinner size="sm" />
                <span>Loading payable invoices...</span>
              </div>
            ) : payableInvoices.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md">
                No payable (due) invoices found.
              </div>
            ) : (
              <Select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                options={payableInvoices.map((inv) => ({
                  value: inv._id,
                  label: `${inv.invoiceNumber} — ${inv.customerId?.name || inv.customerId?.company || 'Customer'} — due ${formatCurrency(inv.amountDue ?? inv.grandTotal ?? 0)}`,
                }))}
                fullWidth
              />
            )}
            {selectedInvoice && (
              <div className="mt-2 text-xs text-[#737373] flex justify-between px-1">
                <span>Customer: <strong>{selectedInvoice.customerId?.name || '—'}</strong></span>
                <span>Grand Total: <strong>{formatCurrency(selectedInvoice.grandTotal || 0)}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <Input
            label="Amount *"
            type="number"
            step="0.01"
            min="0.01"
            max={maxDue || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            helperText={`Amount due: ${formatCurrency(maxDue)}`}
            fullWidth
            required
          />
        </div>

        {/* Method */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1.5">
            Method <span className="text-red-500">*</span>
          </label>
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={PAYMENT_METHODS}
            fullWidth
            required
          />
        </div>

        {/* Paid At */}
        <div>
          <Input
            label="Paid At *"
            type="date"
            max={getTodayDateString()}
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            fullWidth
            required
          />
        </div>

        {/* Reference */}
        <div>
          <Input
            label="Reference"
            type="text"
            placeholder="e.g. Transaction ID, Check #, UPI ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            fullWidth
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1.5">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional payment notes or comments"
            rows={2}
            className="w-full text-xs rounded-lg border border-[#e5e5e5] px-3 py-2 text-[#0b0b0b] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>

        {/* Modal Action Buttons inside form */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0f0f0]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || (loadingPayables && !propInvoice)}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                <span>Recording...</span>
              </span>
            ) : (
              'Record Payment'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
