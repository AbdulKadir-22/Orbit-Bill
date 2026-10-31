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
import { TaxForm } from './components/TaxForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useListQuery } from '../../hooks/useListQuery';
import { taxService } from './services/taxService';
import { STATUS_FILTER_OPTIONS } from '../../constants/options';
import { formatDateTime } from '../../lib/utils';
import { ROLES } from '../../constants/roles';

/**
 * TaxesPage (/taxes)
 * Search + status filter + Reset (no tabs)
 * Columns: # | Tax Name | Rate | Status | Created By | Created At | Actions
 */
export const TaxesPage = () => {
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    page: _page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    data: taxes,
    pagination,
    loading,
    refetch,
  } = useListQuery(taxService.list, { isActive: '' });

  const handleOpenCreate = () => {
    setSelectedTax(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setSelectedTax(tax);
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (selectedTax?._id) {
        await taxService.update(selectedTax._id, payload);
        toast.success('Tax updated successfully.');
      } else {
        await taxService.create(payload);
        toast.success('Tax created successfully.');
      }
      setDrawerOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tax.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tax) => {
    try {
      await taxService.updateStatus(tax._id, !tax.isActive);
      toast.success(
        `Tax ${tax.isActive ? 'deactivated' : 'activated'} successfully.`
      );
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update tax status.');
    }
  };

  const handleDelete = async (tax) => {
    try {
      const res = await taxService.delete(tax._id);
      toast.success(res?.message || 'Tax deleted successfully.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete tax in use.');
    }
  };

  const columns = [
    {
      header: '#',
      className: 'w-16 font-mono text-xs text-neutral-400',
      render: (row, idx) => (pagination.page - 1) * pagination.limit + idx + 1,
    },
    {
      header: 'Tax Name',
      className: 'font-semibold text-neutral-900',
      accessor: 'name',
    },
    {
      header: 'Rate',
      className: 'font-mono text-neutral-900',
      render: (row) => `${row.rate}%`,
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Created By',
      className: 'text-neutral-600',
      render: (row) => row.createdBy?.name || 'System Admin',
    },
    {
      header: 'Created At',
      className: 'text-neutral-500 text-xs font-mono',
      render: (row) => formatDateTime(row.createdAt),
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
                itemName="Tax"
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
        title="Taxes"
        subtitle="Manage tax rules and rates for your business."
      >
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leadingIcon={Plus}
          >
            Add Tax
          </Button>
        )}
      </PageHeader>

      <ListToolbar
        showTabs={false}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search taxes..."
        filters={[
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
        data={taxes}
        loading={loading}
        rowKey="_id"
        emptyTitle="No taxes found"
        emptyDescription="Create a tax rate to apply on invoices and subscriptions."
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Tax Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedTax ? 'Edit Tax' : 'Add Tax'}
        position="right"
        maxWidth="max-w-md"
      >
        <TaxForm
          tax={selectedTax}
          onSubmit={handleFormSubmit}
          onCancel={() => setDrawerOpen(false)}
          submitting={submitting}
        />
      </Drawer>
    </div>
  );
};
