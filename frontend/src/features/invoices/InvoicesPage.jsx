import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useListQuery } from '../../hooks/useListQuery';
import { invoiceService } from './services/invoiceService';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { ListToolbar } from '../../components/common/ListToolbar';
import { CustomerSelect } from '../../components/common/CustomerSelect';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import { RecordPaymentModal } from '../../components/common/RecordPaymentModal';
import { INVOICE_STATUS_OPTIONS } from '../../constants/options';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Plus, MoreVertical, Eye, CheckCircle, Send, XCircle, CreditCard } from 'lucide-react';

export const InvoicesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccessToast, showErrorToast } = useToast();

  // Read initial query params from URL
  const initialCustomerId = searchParams.get('customerId') || '';
  const initialSubscriptionId = searchParams.get('subscriptionId') || '';
  const initialStatus = searchParams.get('status') || '';

  const {
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters: baseResetFilters,
    data: invoices,
    pagination,
    loading,
    refetch,
  } = useListQuery(invoiceService.list, {
    status: initialStatus,
    customerId: initialCustomerId,
    subscriptionId: initialSubscriptionId,
  });

  // Keep URL in sync with filters
  const updateUrlParam = (key, val) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (val) {
        next.set(key, val);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  };

  const handleStatusFilterChange = (val) => {
    setFilter('status', val);
    updateUrlParam('status', val);
  };

  const handleCustomerFilterChange = (val) => {
    setFilter('customerId', val);
    updateUrlParam('customerId', val);
  };

  const handleReset = () => {
    baseResetFilters();
    setSearchParams({}, { replace: true });
  };

  // Generate Due Invoices Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Record payment modal state
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Handlers
  const handleGenerateDueInvoices = async () => {
    setGenerating(true);
    try {
      const report = await invoiceService.generateDue();
      const created = report?.generated ?? report?.created ?? 0;
      const skipped = (report?.skippedAlreadyBilled ?? 0) + (report?.skipped ?? 0);
      showSuccessToast(`Created ${created}, skipped ${skipped} already billed`);
      setIsGenerateOpen(false);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to generate due invoices');
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async (row) => {
    try {
      await invoiceService.confirm(row._id);
      showSuccessToast(`Invoice ${row.invoiceNumber} confirmed`);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to confirm invoice');
    }
  };

  const handleSend = async (row) => {
    try {
      await invoiceService.send(row._id);
      showSuccessToast(`Invoice ${row.invoiceNumber} dispatched`);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to send invoice');
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await invoiceService.cancel(cancelTarget._id, 'Cancelled by operator');
      showSuccessToast(`Invoice ${cancelTarget.invoiceNumber} cancelled`);
      setCancelTarget(null);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  const openRecordPayment = (row) => {
    setPaymentModalInvoice(row);
    setIsPaymentModalOpen(true);
  };

  // Columns: # | Invoice No. | Customer | Subscription | Invoice Date | Due Date | Amount (grandTotal) | Amount Due | Status (InvoiceStatusBadge) | Actions
  const columns = [
    {
      header: '#',
      width: '50px',
      render: (_, idx) => (
        <span className="text-xs text-[#737373] font-mono">
          {(page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: 'Invoice No.',
      render: (row) => (
        <span className="font-semibold text-[#0b0b0b] font-mono text-sm hover:underline">
          {row.invoiceNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="font-medium text-[#171717]">
            {row.customerId?.name || '—'}
          </div>
          {row.customerId?.company && (
            <div className="text-xs text-[#737373]">{row.customerId.company}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Subscription',
      render: (row) => (
        <span className="font-mono text-xs text-[#525252]">
          {row.subscriptionId?.subscriptionNumber || row.subscriptionNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Invoice Date',
      render: (row) => (
        <span className="text-sm text-[#525252]">
          {formatDate(row.invoiceDate || row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      render: (row) => (
        <span className="text-sm text-[#525252]">
          {formatDate(row.dueDate)}
        </span>
      ),
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="font-medium font-mono text-[#171717] text-sm">
          {formatCurrency(row.grandTotal)}
        </span>
      ),
    },
    {
      header: 'Amount Due',
      render: (row) => {
        const isOverdue =
          row.isOverdue ||
          (row.status === 'confirmed' &&
            row.amountDue > 0 &&
            row.dueDate &&
            new Date(row.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0));
        return (
          <span
            className={`font-mono text-sm font-semibold ${
              isOverdue ? 'text-red-600' : 'text-[#171717]'
            }`}
          >
            {formatCurrency(row.amountDue ?? row.grandTotal ?? 0)}
          </span>
        );
      },
    },
    {
      header: 'Status',
      render: (row) => <InvoiceStatusBadge invoice={row} />,
    },
    {
      header: 'Actions',
      width: '60px',
      render: (row) => {
        const isDraft = row.status === 'draft';
        const isConfirmed = row.status === 'confirmed';
        const isCancelled = row.status === 'cancelled';
        const canCancel = (isDraft || isConfirmed) && (row.amountPaid === 0 || !row.amountPaid);
        const canPay = isConfirmed && (row.amountDue > 0 || (row.amountDue === undefined && row.grandTotal > 0));

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === row._id ? null : row._id);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="Actions"
            >
              <MoreVertical size={16} />
            </button>

            {openMenuId === row._id && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-black/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* View */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenMenuId(null);
                    navigate(`/invoices/${row._id}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
                >
                  <Eye size={14} className="text-neutral-500" />
                  <span>View Details</span>
                </button>

                {/* Confirm (draft only) */}
                {isDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      handleConfirm(row);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors text-left"
                  >
                    <CheckCircle size={14} />
                    <span>Confirm</span>
                  </button>
                )}

                {/* Send (not cancelled) */}
                {!isCancelled && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      handleSend(row);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <Send size={14} className="text-neutral-500" />
                    <span>Send Invoice</span>
                  </button>
                )}

                {/* Record Payment (confirmed and amountDue > 0) */}
                {canPay && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      openRecordPayment(row);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <CreditCard size={14} />
                    <span>Record Payment</span>
                  </button>
                )}

                {/* Cancel (draft or confirmed with no payments) */}
                {canCancel && (
                  <>
                    <div className="h-[1px] bg-black/5 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        setCancelTarget(row);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <XCircle size={14} />
                      <span>Cancel Invoice</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Invoices"
        subtitle="Manage invoices generated from subscriptions."
      >
        <Button
          variant="primary"
          leadingIcon={Plus}
          onClick={() => setIsGenerateOpen(true)}
        >
          Generate Due Invoices
        </Button>
      </PageHeader>

      {/* Toolbar: Search + All Status + All Customers + Reset (NO tabs) */}
      <ListToolbar
        showTabs={false}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoices..."
        onReset={handleReset}
        filters={
          <div className="flex items-center gap-3">
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="h-10 px-3 bg-white border border-[#d4d4d4] rounded-lg text-sm text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#0b0b0b]"
            >
              {INVOICE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="w-56">
              <CustomerSelect
                value={filters.customerId || ''}
                onChange={handleCustomerFilterChange}
                allowAll
                allLabel="All Customers"
              />
            </div>
          </div>
        }
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        onRowClick={(row) => navigate(`/invoices/${row._id}`)}
        emptyMessage="No invoices found."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || 0}
        limit={pagination.limit || 10}
        onPageChange={setPage}
      />

      {/* Confirm Dialog for Generate Due Invoices */}
      <ConfirmDialog
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onConfirm={handleGenerateDueInvoices}
        title="Generate Due Invoices"
        description="Create invoices for all subscriptions that are due for billing? Already-billed periods are skipped."
        confirmText="Generate"
        variant="primary"
        loading={generating}
      />

      {/* Confirm Dialog for Cancel Invoice */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title={`Cancel Invoice ${cancelTarget?.invoiceNumber}?`}
        description="Are you sure you want to cancel this invoice? This will restore any applied discounts."
        confirmText="Cancel Invoice"
        variant="danger"
        loading={cancelling}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentModalInvoice(null);
        }}
        invoice={paymentModalInvoice}
        onSaved={() => {
          refetch();
        }}
      />
    </div>
  );
};
