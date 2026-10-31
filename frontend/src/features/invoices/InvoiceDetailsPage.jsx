import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceService } from './services/invoiceService';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import { InvoiceDocument } from '../../components/common/InvoiceDocument';
import { RecordPaymentModal } from '../../components/common/RecordPaymentModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { getPaymentMethodLabel } from '../../constants/options';
import { formatDate, formatCurrency } from '../../lib/utils';
import {
  Send,
  Printer,
  MoreVertical,
  CheckCircle,
  XCircle,
  CreditCard,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Actions menu state
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadInvoice = async () => {
    try {
      const data = await invoiceService.getById(id);
      if (!data) {
        setNotFound(true);
      } else {
        setInvoice(data);
        setNotFound(false);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  useEffect(() => {
    const handleOutside = () => setIsMoreOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Action handlers
  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await invoiceService.confirm(id);
      showSuccessToast('Invoice confirmed');
      setConfirmDialogOpen(false);
      loadInvoice();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to confirm invoice');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await invoiceService.cancel(id, 'Cancelled from invoice details');
      showSuccessToast('Invoice cancelled');
      setCancelDialogOpen(false);
      loadInvoice();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  const handleSend = async () => {
    setActionLoading(true);
    try {
      await invoiceService.send(id);
      showSuccessToast('Invoice dispatched to customer email');
      loadInvoice();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-[#737373]">Loading invoice...</p>
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-black/5 max-w-md mx-auto my-12">
        <h2 className="text-base font-semibold text-[#0b0b0b]">Invoice not found</h2>
        <p className="text-xs text-[#737373] mt-1 mb-4">
          The requested invoice does not exist or has been deleted.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isDraft = invoice.status === 'draft';
  const isConfirmed = invoice.status === 'confirmed';
  const isCancelled = invoice.status === 'cancelled';
  const canCancel = (isDraft || isConfirmed) && (invoice.amountPaid === 0 || !invoice.amountPaid);
  const canPay = isConfirmed && (invoice.amountDue > 0 || (invoice.amountDue === undefined && invoice.grandTotal > 0));
  const payments = invoice.payments || [];

  return (
    <div className="space-y-6 print:m-0 print:p-0 print:w-full">
      {/* Header (Hidden when printing via print styles) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-5 print:hidden">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-[#737373] mb-1.5">
            <Link to="/invoices" className="hover:text-[#0b0b0b] transition-colors">
              Invoices
            </Link>
            <ChevronRight size={12} />
            <span className="font-mono text-[#0b0b0b] font-medium">
              {invoice.invoiceNumber}
            </span>
          </div>

          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0b0b0b] font-mono">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge invoice={invoice} />
          </div>

          {/* Subtitle / Subscription Link */}
          {invoice.subscriptionId ? (
            <div className="text-xs text-[#737373] mt-1">
              Generated from{' '}
              <Link
                to={`/subscriptions/${invoice.subscriptionId._id || invoice.subscriptionId}`}
                className="font-mono font-medium text-black hover:underline"
              >
                {invoice.subscriptionId.subscriptionNumber || invoice.subscriptionNumber || 'Subscription'}
              </Link>
            </div>
          ) : (
            <div className="text-xs text-[#737373] mt-1">Manual Invoice</div>
          )}
        </div>

        {/* Right-side Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leadingIcon={Printer}
          >
            Print
          </Button>

          {!isCancelled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSend}
              leadingIcon={Send}
              disabled={actionLoading}
            >
              Send
            </Button>
          )}

          {/* More Dropdown (Confirm & Cancel) */}
          {(isDraft || canCancel) && (
            <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMoreOpen((prev) => !prev)}
                trailingIcon={MoreVertical}
              >
                More
              </Button>

              {isMoreOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-black/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setConfirmDialogOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors text-left"
                    >
                      <CheckCircle size={14} />
                      <span>Confirm Invoice</span>
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setCancelDialogOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <XCircle size={14} />
                      <span>Cancel Invoice</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clean Read-Only Invoice Document component */}
      <div className="invoice-print-area">
        <InvoiceDocument invoice={invoice} />
      </div>

      {/* Payments Card (Hidden in print) */}
      <div className="print:hidden">
        <Card className="p-0 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#f0f0f0] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0b0b0b]">
              Payments ({payments.length})
            </h3>
            {canPay && (
              <Button
                variant="primary"
                size="sm"
                leadingIcon={CreditCard}
                onClick={() => setIsPaymentModalOpen(true)}
              >
                + Record Payment
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-xs font-semibold text-[#737373]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Payment No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-[#737373]">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-[#fafafa]/60 transition-colors">
                      <td className="py-3 px-4 text-xs text-[#737373] font-mono text-center">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#0b0b0b]">
                        {p.paymentNumber || `PAY-${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#525252]">
                        {formatDate(p.paidAt || p.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#171717]">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#525252]">
                        {getPaymentMethodLabel(p.method)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#737373]">
                        {p.reference || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#737373] max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Confirm Dialog for Confirming Invoice */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirm}
        title={`Confirm Invoice ${invoice.invoiceNumber}?`}
        description="Transitioning this draft invoice to confirmed will make it payable and ready for sending to customer."
        confirmText="Confirm Invoice"
        variant="primary"
        loading={confirming}
      />

      {/* Confirm Dialog for Cancelling Invoice */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title={`Cancel Invoice ${invoice.invoiceNumber}?`}
        description="Are you sure you want to cancel this invoice? This action cannot be undone and will restore applied discount counts."
        confirmText="Cancel Invoice"
        variant="danger"
        loading={cancelling}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
        onSaved={() => {
          loadInvoice();
        }}
      />
    </div>
  );
};
