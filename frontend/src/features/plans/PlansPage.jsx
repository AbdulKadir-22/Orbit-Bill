import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Drawer } from '../../components/ui/Drawer';
import { ListToolbar } from '../../components/common/ListToolbar';
import { RowActions } from '../../components/common/RowActions';
import { PlanForm } from './components/PlanForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useListQuery } from '../../hooks/useListQuery';
import { planService } from './services/planService';
import { BILLING_CYCLE_OPTIONS, STATUS_FILTER_OPTIONS } from '../../constants/options';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ROLES } from '../../constants/roles';

/**
 * PlansPage (/plans)
 */
export const PlansPage = () => {
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    page: _page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    activeTab,
    setActiveTab,
    resetFilters,
    data: plans,
    pagination,
    counts,
    loading,
    refetch,
  } = useListQuery(planService.list, { billingCycle: '', isActive: '' });

  const handleOpenCreate = () => {
    setSelectedPlan(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setSelectedPlan(plan);
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (selectedPlan?._id) {
        await planService.update(selectedPlan._id, payload);
        toast.success('Plan updated successfully.');
      } else {
        await planService.create(payload);
        toast.success('Plan created successfully.');
      }
      setDrawerOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      await planService.updateStatus(plan._id, !plan.isActive);
      toast.success(
        `Plan ${plan.isActive ? 'deactivated' : 'activated'} successfully.`
      );
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plan status.');
    }
  };

  const handleDelete = async (plan) => {
    try {
      const res = await planService.delete(plan._id);
      toast.success(res?.message || 'Plan deleted successfully.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete plan in use.');
    }
  };

  const columns = [
    {
      header: '#',
      className: 'w-16 font-mono text-xs text-neutral-400',
      render: (row, idx) => (pagination.page - 1) * pagination.limit + idx + 1,
    },
    {
      header: 'Plan Name',
      className: 'font-semibold text-neutral-900',
      accessor: 'name',
    },
    {
      header: 'Billing Cycle',
      className: 'capitalize text-neutral-600',
      accessor: 'billingCycle',
    },
    {
      header: 'Price',
      className: 'font-mono text-neutral-900',
      render: (row) => formatCurrency(row.price),
    },
    {
      header: 'Min Quantity',
      className: 'font-mono text-neutral-600',
      accessor: 'minQuantity',
    },
    {
      header: 'Availability',
      className: 'text-xs text-neutral-600',
      render: (row) => {
        const from = formatDate(row.availableFrom) || 'Anytime';
        const to = row.availableTo ? formatDate(row.availableTo) : '∞';
        return `${from} - ${to}`;
      },
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            className: 'w-16 text-right',
            render: (row) => (
              <RowActions
                canManage={isAdmin}
                isActive={row.isActive}
                itemName="Plan"
                onEdit={() => handleOpenEdit(row)}
                onToggleStatus={() => handleToggleStatus(row)}
                onDelete={() => handleDelete(row)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        subtitle="Manage subscription plans, pricing and billing configurations."
      >
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leadingIcon={Plus}
          >
            Add Plan
          </Button>
        )}
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search plans..."
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        filters={[
          {
            id: 'billingCycle',
            value: filters.billingCycle,
            onChange: (v) => setFilter('billingCycle', v),
            options: BILLING_CYCLE_OPTIONS,
          },
          {
            id: 'isActive',
            value: filters.isActive,
            onChange: (v) => setFilter('isActive', v),
            options: STATUS_FILTER_OPTIONS,
          },
        ]}
        onReset={resetFilters}
      />

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        rowKey="_id"
        emptyTitle="No plans found"
        emptyDescription="Create your first subscription plan to get started."
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Plan Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedPlan ? 'Edit Plan' : 'Add Plan'}
        position="right"
        maxWidth="max-w-md"
      >
        <PlanForm
          plan={selectedPlan}
          onSubmit={handleFormSubmit}
          onCancel={() => setDrawerOpen(false)}
          submitting={submitting}
        />
      </Drawer>
    </div>
  );
};
