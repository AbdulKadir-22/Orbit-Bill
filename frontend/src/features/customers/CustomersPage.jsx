import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { Drawer } from '../../components/ui/Drawer';
import { ListToolbar } from '../../components/common/ListToolbar';
import { RowActions } from '../../components/common/RowActions';
import { CustomerForm } from './components/CustomerForm';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useListQuery } from '../../hooks/useListQuery';
import { customerService } from './services/customerService';
import { STATUS_FILTER_OPTIONS } from '../../constants/options';
import { ROLES } from '../../constants/roles';

/**
 * CustomersPage (/customers)
 * Columns: # | Name (Avatar + name) | Company | Email | Phone | Status | Actions
 */
export const CustomersPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = useAuth();
  const canManage = role === ROLES.ADMIN || role === ROLES.STAFF;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
    data: customers,
    pagination,
    counts,
    loading,
    refetch,
  } = useListQuery(customerService.list, { isActive: '' });

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const handleFormSubmit = async (payload, setFieldError) => {
    setSubmitting(true);
    try {
      if (selectedCustomer?._id) {
        await customerService.update(selectedCustomer._id, payload);
        toast.success('Customer updated successfully.');
      } else {
        await customerService.create(payload);
        toast.success('Customer created successfully.');
      }
      setDrawerOpen(false);
      refetch();
    } catch (err) {
      if (err.response?.status === 409) {
        setFieldError((prev) => ({
          ...prev,
          email: 'An account with this email address already exists.',
        }));
      } else {
        toast.error(err.response?.data?.message || 'Failed to save customer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (customer) => {
    try {
      await customerService.updateStatus(customer._id, !customer.isActive);
      toast.success(
        `Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully.`
      );
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (customer) => {
    try {
      const res = await customerService.delete(customer._id);
      toast.success(res?.message || 'Customer deleted successfully.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  const columns = [
    {
      header: '#',
      className: 'w-16 font-mono text-xs text-neutral-400',
      render: (row, idx) => (pagination.page - 1) * pagination.limit + idx + 1,
    },
    {
      header: 'Name',
      className: 'font-medium text-neutral-900',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="md" />
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900 hover:underline">
              {row.name}
            </span>
            {row.gstin && (
              <span className="text-[11px] text-neutral-400 font-mono">
                GST: {row.gstin}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Company',
      className: 'text-neutral-700',
      render: (row) => row.company || '—',
    },
    {
      header: 'Email',
      className: 'text-neutral-600',
      accessor: 'email',
    },
    {
      header: 'Phone',
      className: 'text-neutral-600 font-mono text-xs',
      render: (row) => row.phone || '—',
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
      header: 'Actions',
      className: 'w-16 text-right',
      render: (row) => (
        <RowActions
          canManage={canManage}
          isActive={row.isActive}
          itemName="Customer"
          onEdit={() => handleOpenEdit(row)}
          onToggleStatus={() => handleToggleStatus(row)}
          onDelete={() => handleDelete(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage your customers and their subscription details."
      >
        {canManage && (
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leadingIcon={Plus}
          >
            Add Customer
          </Button>
        )}
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customers..."
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
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
        data={customers}
        loading={loading}
        rowKey="_id"
        onRowClick={(row) => navigate(`/customers/${row._id}`)}
        emptyTitle="No customers found"
        emptyDescription="Get started by creating your first customer profile."
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Customer Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedCustomer ? 'Edit Customer' : 'Add Customer'}
        position="right"
        maxWidth="max-w-lg"
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={handleFormSubmit}
          onCancel={() => setDrawerOpen(false)}
          submitting={submitting}
        />
      </Drawer>
    </div>
  );
};
