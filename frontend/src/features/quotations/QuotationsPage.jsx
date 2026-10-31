import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListQuery } from '../../hooks/useListQuery';
import { quotationService } from './services/quotationService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { ListToolbar } from '../../components/common/ListToolbar';
import { RowActions } from '../../components/common/RowActions';
import { CustomerSelect } from '../../components/common/CustomerSelect';
import { QuotationTemplatesDrawer } from './QuotationTemplatesDrawer';
import { getStatusBadgeVariant } from '../../constants/statusStyles';
import { formatDate, formatCurrency } from '../../lib/utils';

export const QuotationsPage = () => {
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [convertTarget, setConvertTarget] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const {
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    activeTab,
    setActiveTab,
    resetFilters,
    data: quotations,
    pagination,
    counts,
    loading,
    refetch,
  } = useListQuery(quotationService.list, { status: '', customerId: '' });

  // Status helper (checks expired dynamically)
  const getDisplayStatus = (row) => {
    if (row.status === 'expired') return 'expired';
    if (row.validUntil && new Date(row.validUntil) < new Date() && ['draft', 'sent'].includes(row.status)) {
      return 'expired';
    }
    return row.status;
  };

  const handleSend = async (row) => {
    try {
      await quotationService.send(row._id);
      showSuccessToast(`Quotation ${row.quoteNumber} marked as sent`);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to send quotation');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await quotationService.delete(deleteTarget._id);
      showSuccessToast('Quotation deleted successfully');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to delete quotation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConvert = async () => {
    if (!convertTarget) return;
    setIsConverting(true);
    try {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const res = await quotationService.convert(convertTarget._id, {
        startDate: now.toISOString(),
        expiryDate: thirtyDays.toISOString(),
        paymentTerms: 'Net 15',
      });
      showSuccessToast('Quotation converted to subscription');
      const subId = res?.subscription?._id || res?._id;
      if (subId) {
        navigate(`/subscriptions/${subId}`);
      } else {
        navigate('/subscriptions');
      }
    } catch (err) {
      showErrorToast(err?.message || 'Failed to convert quotation');
    } finally {
      setIsConverting(false);
      setConvertTarget(null);
    }
  };

  const tabs = [
    { id: 'all', key: 'all', label: 'All Quotations', count: counts.all },
    { id: 'draft', key: 'draft', label: 'Draft', count: counts.draft },
    { id: 'sent', key: 'sent', label: 'Sent', count: counts.sent },
    { id: 'confirmed', key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { id: 'expired', key: 'expired', label: 'Expired', count: counts.expired },
  ];

  const columns = [
    {
      header: '#',
      width: '60px',
      render: (_, idx) => (
        <span className="text-xs text-[#737373] font-mono">
          {(page - 1) * pagination.limit + idx + 1}
        </span>
      ),
    },
    {
      header: 'Quotation No.',
      render: (row) => (
        <span className="font-semibold text-[#0b0b0b] font-mono text-sm hover:underline">
          {row.quoteNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="font-medium text-[#171717]">{row.customerId?.name || '—'}</div>
          {row.customerId?.company && (
            <div className="text-xs text-[#737373]">{row.customerId.company}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Created Date',
      render: (row) => <span className="text-sm text-[#525252]">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Valid Until',
      render: (row) => (
        <span className="text-sm text-[#525252]">
          {row.validUntil ? formatDate(row.validUntil) : `${row.validityDays || 30} days`}
        </span>
      ),
    },
    {
      header: 'Grand Total',
      render: (row) => (
        <span className="font-medium font-mono text-[#171717] text-sm">
          {formatCurrency(row.grandTotal)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const displayStatus = getDisplayStatus(row);
        return (
          <Badge variant={getStatusBadgeVariant('quotation', displayStatus)}>
            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      width: '80px',
      render: (row) => {
        const displayStatus = getDisplayStatus(row);
        const isDraft = row.status === 'draft' && displayStatus !== 'expired';
        const canConvert = ['draft', 'sent'].includes(row.status) && displayStatus !== 'expired';

        const actions = [
          {
            label: isDraft ? 'Edit' : 'View',
            onClick: () => navigate(`/quotations/${row._id}`),
          },
        ];

        if (isDraft) {
          actions.push({
            label: 'Send',
            onClick: () => handleSend(row),
          });
        }

        if (canConvert) {
          actions.push({
            label: 'Convert to Subscription',
            onClick: () => setConvertTarget(row),
          });
        }

        if (row.status === 'draft') {
          actions.push({
            label: 'Delete',
            danger: true,
            onClick: () => setDeleteTarget(row),
          });
        }

        return <RowActions actions={actions} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        subtitle="Create and manage customer quotations. Convert confirmed quotations to subscriptions."
      >
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsTemplatesOpen(true)}
          >
            Templates
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/quotations/new')}
          >
            + Create Quotation
          </Button>
        </div>
      </PageHeader>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'all') {
            setFilter('status', '');
          } else {
            setFilter('status', tab);
          }
        }}
      />

      <ListToolbar
        showTabs={false}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search quotations..."
        onReset={resetFilters}
        filters={
          <div className="flex items-center gap-3">
            <div className="w-56">
              <CustomerSelect
                value={filters.customerId}
                onChange={(val) => setFilter('customerId', val)}
                allowAll
                allLabel="All Customers"
              />
            </div>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilter('status', e.target.value)}
              className="h-10 px-3 bg-white border border-[#d4d4d4] rounded-lg text-sm text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#0b0b0b]"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={quotations}
        loading={loading}
        onRowClick={(row) => navigate(`/quotations/${row._id}`)}
        emptyMessage="No quotations found."
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || 0}
        limit={pagination.limit || 10}
        onPageChange={setPage}
      />

      {/* Templates Drawer */}
      <QuotationTemplatesDrawer
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
      />

      {/* Confirm Delete Quotation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Quotation"
        message={`Are you sure you want to delete quotation ${deleteTarget?.quoteNumber || ''}? This action cannot be undone.`}
        confirmText="Delete Quotation"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Confirm Convert to Subscription */}
      <ConfirmDialog
        isOpen={!!convertTarget}
        title="Convert to Subscription"
        message="This will confirm the quotation and create a subscription."
        confirmText="Convert"
        confirmVariant="primary"
        isLoading={isConverting}
        onConfirm={handleConvert}
        onClose={() => setConvertTarget(null)}
      />
    </div>
  );
};
