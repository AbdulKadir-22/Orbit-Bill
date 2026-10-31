import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListQuery } from '../../hooks/useListQuery';
import { subscriptionService } from './services/subscriptionService';
import { PageHeader } from '../../components/layout/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { ListToolbar } from '../../components/common/ListToolbar';
import { RowActions } from '../../components/common/RowActions';
import { CustomerSelect } from '../../components/common/CustomerSelect';
import { getStatusBadgeVariant } from '../../constants/statusStyles';
import { formatDate } from '../../lib/utils';

export const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    data: subscriptions,
    pagination,
    counts,
    loading,
    refetch,
  } = useListQuery(subscriptionService.list, {
    status: '',
    customerId: '',
    billingCycle: '',
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await subscriptionService.delete(deleteTarget._id);
      showSuccessToast('Subscription deleted successfully');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to delete subscription');
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { id: 'all', key: 'all', label: 'All Subscriptions', count: counts.all },
    { id: 'draft', key: 'draft', label: 'Draft', count: counts.draft },
    { id: 'confirmed', key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { id: 'active', key: 'active', label: 'Active', count: counts.active },
    { id: 'paused', key: 'paused', label: 'Paused', count: counts.paused },
    { id: 'closed', key: 'closed', label: 'Closed', count: counts.closed },
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
      header: 'Subscription No.',
      render: (row) => (
        <span className="font-semibold text-[#0b0b0b] font-mono text-sm hover:underline">
          {row.subscriptionNumber}
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
      header: 'Plan',
      render: (row) => {
        const lines = row.lines || [];
        if (lines.length === 0) return '—';
        const firstPlan = lines[0].planName || lines[0].planId?.name || 'Standard';
        const moreCount = lines.length - 1;
        return (
          <span className="text-sm text-[#171717]">
            {firstPlan}
            {moreCount > 0 && (
              <span className="text-xs text-[#737373] ml-1">+{moreCount} more</span>
            )}
          </span>
        );
      },
    },
    {
      header: 'Start Date',
      render: (row) => <span className="text-sm text-[#525252]">{formatDate(row.startDate)}</span>,
    },
    {
      header: 'Expiry Date',
      render: (row) => <span className="text-sm text-[#525252]">{formatDate(row.expiryDate)}</span>,
    },
    {
      header: 'Next Billing',
      render: (row) => (
        <span className="text-sm text-[#525252]">
          {row.nextBillingDate ? formatDate(row.nextBillingDate) : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={getStatusBadgeVariant('subscription', row.status)}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      width: '80px',
      render: (row) => {
        const isDraft = row.status === 'draft';
        const isAdmin = role === ROLES.ADMIN;

        const actions = [
          {
            label: 'View',
            onClick: () => navigate(`/subscriptions/${row._id}`),
          },
        ];

        // Delete draft only, admin only
        if (isDraft && isAdmin) {
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
        title="Subscriptions"
        subtitle="Manage customer subscriptions and their lifecycle."
      />

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
        searchPlaceholder="Search subscriptions..."
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
              <option value="quotation">Quotation</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={filters.billingCycle || ''}
              onChange={(e) => setFilter('billingCycle', e.target.value)}
              className="h-10 px-3 bg-white border border-[#d4d4d4] rounded-lg text-sm text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#0b0b0b]"
            >
              <option value="">All Billing Cycles</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        onRowClick={(row) => navigate(`/subscriptions/${row._id}`)}
        emptyMessage="No subscriptions found."
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.total || 0}
        limit={pagination.limit || 10}
        onPageChange={setPage}
      />

      {/* Delete Draft Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Subscription"
        message={`Are you sure you want to delete subscription ${deleteTarget?.subscriptionNumber}? This action cannot be undone.`}
        confirmText="Delete Subscription"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
