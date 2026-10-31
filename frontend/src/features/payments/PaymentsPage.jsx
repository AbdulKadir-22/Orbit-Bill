import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useListQuery } from '../../hooks/useListQuery';
import { paymentService } from './services/paymentService';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { ListToolbar } from '../../components/common/ListToolbar';
import { RecordPaymentModal } from '../../components/common/RecordPaymentModal';
import { PAYMENT_METHOD_FILTER_OPTIONS, getPaymentMethodLabel } from '../../constants/options';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Plus, MoreVertical, Eye, Trash2 } from 'lucide-react';

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const isAdmin = user?.role === ROLES.ADMIN;

  // Initial filters from query params
  const initialCustomerId = searchParams.get('customerId') || '';
  const initialInvoiceId = searchParams.get('invoiceId') || '';
  const initialMethod = searchParams.get('method') || '';

  const {
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters: baseResetFilters,
    data: payments,
    pagination,
    loading,
    refetch,
  } = useListQuery(paymentService.list, {
    method: initialMethod,
    customerId: initialCustomerId,
    invoiceId: initialInvoiceId,
    fromDate: '',
    toDate: '',
  });

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

  const handleMethodChange = (val) => {
    setFilter('method', val);
    updateUrlParam('method', val);
  };

  const handleFromDateChange = (val) => {
    setFilter('fromDate', val);
  };

  const handleToDateChange = (val) => {
    setFilter('toDate', val);
  };

  const handleReset = () => {
    baseResetFilters();
    setSearchParams({}, { replace: true });
  };

  // Record payment modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Delete payment modal (admin only)
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentService.delete(deleteTarget._id, 'Payment voided/deleted by admin');
      showSuccessToast('Payment deleted and invoice totals updated');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to delete payment');
    } finally {
      setDeleting(false);
    }
  };

  // Columns: # | Payment No. | Invoice No. (link) | Customer | Amount | Method | Paid At | Recorded By | Actions
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
      header: 'Payment No.',
      render: (row) => (
        <span className="font-semibold text-[#0b0b0b] font-mono text-sm">
          {row.paymentNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Invoice No.',
      render: (row) => {
        const invId = row.invoiceId?._id || row.invoiceId;
        const invNumber = row.invoiceId?.invoiceNumber || row.invoiceNumber || 'Invoice';
        return invId ? (
          <Link
            to={`/invoices/${invId}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-sm font-semibold text-black hover:underline"
          >
            {invNumber}
          </Link>
        ) : (
          <span className="font-mono text-sm text-[#737373]">—</span>
        );
      },
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
      header: 'Amount',
      render: (row) => (
        <span className="font-medium font-mono text-[#171717] text-sm">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: 'Method',
      render: (row) => (
        <span className="text-sm text-[#525252]">
          {getPaymentMethodLabel(row.method)}
        </span>
      ),
    },
    {
      header: 'Paid At',
      render: (row) => (
        <span className="text-sm text-[#525252]">
          {formatDate(row.paidAt || row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Recorded By',
      render: (row) => (
        <span className="text-xs text-[#525252]">
          {row.recordedBy?.name || 'System / Admin'}
        </span>
      ),
    },
    {
      header: 'Actions',
      width: '60px',
      render: (row) => {
        const invId = row.invoiceId?._id || row.invoiceId;
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
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-black/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {invId && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      navigate(`/invoices/${invId}`);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <Eye size={14} className="text-neutral-500" />
                    <span>View Invoice</span>
                  </button>
                )}

                {/* Delete action (Admin only; staff cannot see) */}
                {isAdmin && (
                  <>
                    <div className="h-[1px] bg-black/5 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        setDeleteTarget(row);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
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
        title="Payments"
        subtitle="Manage and record payments against invoices."
      >
        <Button
          variant="primary"
          leadingIcon={Plus}
          onClick={() => setIsRecordModalOpen(true)}
        >
          Record Payment
        </Button>
      </PageHeader>

      {/* Toolbar: Search + All Methods + From date + To date + Reset (NO status filter) */}
      <ListToolbar
        showTabs={false}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payments..."
        onReset={handleReset}
        filters={
          <div className="flex items-center flex-wrap gap-2.5">
            <select
              value={filters.method || ''}
              onChange={(e) => handleMethodChange(e.target.value)}
              className="h-10 px-3 bg-white border border-[#d4d4d4] rounded-lg text-sm text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#0b0b0b]"
            >
              {PAYMENT_METHOD_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* From Date */}
            <div className="flex items-center gap-1.5 bg-white border border-[#d4d4d4] rounded-lg px-2.5 h-10">
              <span className="text-xs text-[#737373]">From:</span>
              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="text-xs text-[#171717] focus:outline-none bg-transparent"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5 bg-white border border-[#d4d4d4] rounded-lg px-2.5 h-10">
              <span className="text-xs text-[#737373]">To:</span>
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="text-xs text-[#171717] focus:outline-none bg-transparent"
              />
            </div>
          </div>
        }
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyMessage="No payments found."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || 0}
        limit={pagination.limit || 10}
        onPageChange={setPage}
      />

      {/* Record Payment Modal without fixed invoice */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSaved={() => {
          refetch();
        }}
      />

      {/* Delete / Void Payment Confirm Dialog (Admin Only) */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Payment ${deleteTarget?.paymentNumber}?`}
        description="This will reduce the amount paid on the invoice."
        confirmText="Delete Payment"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
