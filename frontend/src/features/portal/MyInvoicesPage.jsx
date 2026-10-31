import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Download, Printer } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import { InvoiceDocument } from '../../components/common/InvoiceDocument';
import { portalService } from './services/portalService';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getPaymentMethodLabel } from '../../constants/options';

export const MyInvoicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial tab and filters from URL (?tab=payments, ?subscriptionId=...)
  const initialTab = searchParams.get('tab') === 'payments' ? 'payments' : 'invoices';
  const initialSubscriptionId = searchParams.get('subscriptionId') || '';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [statusFilter, setStatusFilter] = useState('');
  const [subscriptionIdFilter, setSubscriptionIdFilter] = useState(initialSubscriptionId);

  // Invoices pagination & state
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoices, setInvoices] = useState([]);
  const [invoicePagination, setInvoicePagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  // Payments pagination & state
  const [paymentPage, setPaymentPage] = useState(1);
  const [payments, setPayments] = useState([]);
  const [paymentPagination, setPaymentPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load Invoices
  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const params = {
        page: invoicePage,
        limit: 10,
      };
      if (statusFilter) params.status = statusFilter;
      if (subscriptionIdFilter) params.subscriptionId = subscriptionIdFilter;

      const res = await portalService.getInvoices(params);
      setInvoices(res.data || []);
      if (res.pagination) setInvoicePagination(res.pagination);
    } catch (err) {
      console.error('Failed to load portal invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Load Payments
  const loadPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await portalService.getPayments({
        page: paymentPage,
        limit: 10,
      });
      setPayments(res.data || []);
      if (res.pagination) setPaymentPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load portal payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadInvoices();
    } else {
      loadPayments();
    }
  }, [activeTab, invoicePage, paymentPage, statusFilter, subscriptionIdFilter]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'payments') {
        next.set('tab', 'payments');
      } else {
        next.delete('tab');
      }
      return next;
    });
  };

  // Open Invoice Modal
  const openInvoiceModal = async (invoice, triggerPrint = false) => {
    setViewModalOpen(true);
    setModalLoading(true);
    try {
      const full = await portalService.getInvoiceById(invoice._id);
      setSelectedInvoice(full || invoice);
      if (triggerPrint) {
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch {
      setSelectedInvoice(invoice);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Invoices"
        subtitle="View and download your invoices and payment history."
      />

      {/* Tabs: Invoices | Payments */}
      <div className="flex border-b border-neutral-200 space-x-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => handleTabChange('invoices')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'invoices'
              ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Invoices
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('payments')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'payments'
              ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Payments
        </button>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters Bar: Status (confirmed, paid, overdue) + Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200/80">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setInvoicePage(1);
                }}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>

              {subscriptionIdFilter && (
                <div className="inline-flex items-center text-xs bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-md">
                  Filtered by Subscription
                  <button
                    type="button"
                    onClick={() => {
                      setSubscriptionIdFilter('');
                      setInvoicePage(1);
                    }}
                    className="ml-1.5 font-bold hover:text-black"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {(statusFilter || subscriptionIdFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setSubscriptionIdFilter('');
                  setInvoicePage(1);
                }}
                className="text-xs h-7 text-neutral-500"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Invoices Table Card */}
          <Card className="p-0 overflow-hidden">
            {invoicesLoading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Spinner size="md" />
                <p className="text-xs text-neutral-400 mt-2 font-medium">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-medium text-neutral-600">No invoices found</p>
                <p className="text-xs text-neutral-400 mt-1">There are no invoices matching your filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Invoice No.</th>
                        <th className="py-3 px-4">Subscription</th>
                        <th className="py-3 px-4">Invoice Date</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Amount Due</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {invoices.map((inv, idx) => (
                        <tr
                          key={inv._id}
                          className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                          onClick={() => openInvoiceModal(inv, false)}
                        >
                          <td className="py-3 px-4 font-mono text-neutral-400">
                            {(invoicePagination.page - 1) * invoicePagination.limit + idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {inv.subscriptionNumber || inv.subscriptionId?.subscriptionNumber || '—'}
                          </td>
                          <td className="py-3 px-4 text-neutral-500">
                            {inv.invoiceDate ? formatDate(inv.invoiceDate) : '—'}
                          </td>
                          <td className="py-3 px-4 text-neutral-500">
                            {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-neutral-900">
                            {formatCurrency(inv.grandTotal)}
                          </td>
                          <td className="py-3 px-4 font-medium text-neutral-800">
                            {formatCurrency(inv.amountDue)}
                          </td>
                          <td className="py-3 px-4">
                            <InvoiceStatusBadge invoice={inv} />
                          </td>
                          <td
                            className="py-3 px-4 text-right space-x-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => openInvoiceModal(inv, false)}
                            >
                              <Eye size={12} className="mr-1" /> View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => openInvoiceModal(inv, true)}
                            >
                              <Download size={12} className="mr-1" /> Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {invoicePagination.totalPages > 1 && (
                  <div className="p-4 border-t border-neutral-100">
                    <Pagination
                      currentPage={invoicePagination.page}
                      totalPages={invoicePagination.totalPages}
                      onPageChange={(p) => setInvoicePage(p)}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Card className="p-0 overflow-hidden">
          {paymentsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Spinner size="md" />
              <p className="text-xs text-neutral-400 mt-2 font-medium">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-medium text-neutral-600">No payment history</p>
              <p className="text-xs text-neutral-400 mt-1">Recorded payments will appear here.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Payment No.</th>
                      <th className="py-3 px-4">Invoice No.</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {payments.map((pay, idx) => (
                      <tr key={pay._id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {(paymentPagination.page - 1) * paymentPagination.limit + idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                          {pay.paymentNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-600">
                          {pay.invoiceNumber || pay.invoiceId?.invoiceNumber || '—'}
                        </td>
                        <td className="py-3 px-4 text-neutral-500">
                          {pay.paidAt ? formatDate(pay.paidAt) : '—'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          {formatCurrency(pay.amount)}
                        </td>
                        <td className="py-3 px-4 text-neutral-700 capitalize">
                          {getPaymentMethodLabel(pay.method)}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 font-mono">
                          {pay.reference || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paymentPagination.totalPages > 1 && (
                <div className="p-4 border-t border-neutral-100">
                  <Pagination
                    currentPage={paymentPagination.page}
                    totalPages={paymentPagination.totalPages}
                    onPageChange={(p) => setPaymentPage(p)}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Invoice Document Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice'}
        size="xl"
      >
        {modalLoading && !selectedInvoice ? (
          <div className="py-12 flex justify-center">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Printable Invoice Container */}
            <div className="print-area">
              <InvoiceDocument invoice={selectedInvoice} />

              {/* Payments Section in modal */}
              {Array.isArray(selectedInvoice?.payments) && selectedInvoice.payments.length > 0 && (
                <div className="mt-6 pt-5 border-t border-neutral-100">
                  <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
                    Payment History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-50 text-neutral-500">
                        <tr>
                          <th className="py-2 px-3">Payment No.</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {selectedInvoice.payments.map((p) => (
                          <tr key={p._id}>
                            <td className="py-2 px-3 font-mono font-medium text-neutral-900">
                              {p.paymentNumber}
                            </td>
                            <td className="py-2 px-3 text-neutral-500">
                              {p.paidAt ? formatDate(p.paidAt) : '—'}
                            </td>
                            <td className="py-2 px-3 text-neutral-700 capitalize">
                              {getPaymentMethodLabel(p.method)}
                            </td>
                            <td className="py-2 px-3 font-semibold text-neutral-900">
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-neutral-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadPdf}
                className="inline-flex items-center"
              >
                <Printer size={13} className="mr-1.5" />
                Download / Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
