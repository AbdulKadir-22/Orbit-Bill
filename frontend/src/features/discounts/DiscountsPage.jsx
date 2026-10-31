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
import { DiscountForm } from './components/DiscountForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useListQuery } from '../../hooks/useListQuery';
import { discountService } from './services/discountService';
import { DISCOUNT_TYPE_OPTIONS, STATUS_FILTER_OPTIONS } from '../../constants/options';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ROLES } from '../../constants/roles';

/**
 * DiscountsPage (/discounts)
 * Columns: # | Discount Name | Type | Value | Min Purchase | Min Qty | Applies To | Validity Period | Usage | Status | Actions
 */
export const DiscountsPage = () => {
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
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
    data: discounts,
    pagination,
    counts,
    loading,
    refetch,
  } = useListQuery(discountService.list, { type: '', isActive: '' });

  const handleOpenCreate = () => {
    setSelectedDiscount(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (discount) => {
    setSelectedDiscount(discount);
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (selectedDiscount?._id) {
        await discountService.update(selectedDiscount._id, payload);
        toast.success('Discount updated successfully.');
      } else {
        await discountService.create(payload);
        toast.success('Discount created successfully.');
      }
      setDrawerOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save discount.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      await discountService.updateStatus(discount._id, !discount.isActive);
      toast.success(
        `Discount ${discount.isActive ? 'deactivated' : 'activated'} successfully.`
      );
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update discount status.');
    }
  };

  const handleDelete = async (discount) => {
    try {
      const res = await discountService.delete(discount._id);
      toast.success(res?.message || 'Discount deleted successfully.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete discount in use.');
    }
  };

  const columns = [
    {
      header: '#',
      className: 'w-16 font-mono text-xs text-neutral-400',
      render: (row, idx) => (pagination.page - 1) * pagination.limit + idx + 1,
    },
    {
      header: 'Discount Name',
      className: 'font-semibold text-neutral-900',
      accessor: 'name',
    },
    {
      header: 'Type',
      className: 'capitalize text-neutral-600',
      render: (row) => (row.type === 'percentage' ? 'Percentage' : 'Fixed Amount'),
    },
    {
      header: 'Value',
      className: 'font-mono text-neutral-900',
      render: (row) =>
        row.type === 'percentage' ? `${row.value}%` : formatCurrency(row.value),
    },
    {
      header: 'Min Purchase',
      className: 'font-mono text-neutral-500',
      render: (row) => formatCurrency(row.minPurchase || 0),
    },
    {
      header: 'Min Qty',
      className: 'font-mono text-neutral-500',
      accessor: 'minQuantity',
    },
    {
      header: 'Applies To',
      className: 'text-neutral-600 text-xs',
      render: (row) =>
        row.appliesTo === 'subscription' ? 'Entire Subscription' : 'Selected Products',
    },
    {
      header: 'Validity Period',
      className: 'text-xs text-neutral-600',
      render: (row) => {
        const start = formatDate(row.startDate) || 'Anytime';
        const end = formatDate(row.endDate) || '∞';
        return `${start} - ${end}`;
      },
    },
    {
      header: 'Usage',
      className: 'font-mono text-xs text-neutral-600',
      render: (row) => `${row.usedCount || 0} / ${row.usageLimit != null ? row.usageLimit : '∞'}`,
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
                itemName="Discount"
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
        title="Discounts"
        subtitle="Manage discount rules and promotional offers."
      >
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leadingIcon={Plus}
          >
            Add Discount
          </Button>
        )}
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search discounts..."
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        filters={[
          {
            id: 'type',
            value: filters.type,
            onChange: (v) => setFilter('type', v),
            options: DISCOUNT_TYPE_OPTIONS,
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
        data={discounts}
        loading={loading}
        rowKey="_id"
        emptyTitle="No discounts found"
        emptyDescription="Create your first promotional discount rule."
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Discount Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedDiscount ? 'Edit Discount' : 'Add Discount'}
        position="right"
        maxWidth="max-w-md"
      >
        <DiscountForm
          discount={selectedDiscount}
          onSubmit={handleFormSubmit}
          onCancel={() => setDrawerOpen(false)}
          submitting={submitting}
        />
      </Drawer>
    </div>
  );
};
