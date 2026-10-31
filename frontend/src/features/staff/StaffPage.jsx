import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { ListToolbar } from '../../components/common/ListToolbar';
import { RowActions } from '../../components/common/RowActions';
import { StaffModal } from './components/StaffModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useListQuery } from '../../hooks/useListQuery';
import { staffService } from './services/staffService';
import { STATUS_FILTER_OPTIONS } from '../../constants/options';
import { formatDateTime } from '../../lib/utils';
import { ROLES } from '../../constants/roles';

/**
 * StaffPage (/staff) - Admin Only
 * Columns: # | Name | Email | Status | Created At | Actions
 */
export const StaffPage = () => {
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    page: _page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    data: staffList,
    pagination,
    loading,
    refetch,
  } = useListQuery(staffService.list, { isActive: '' });

  const handleOpenCreate = () => {
    setSelectedStaff(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setSelectedStaff(staff);
    setModalOpen(true);
  };

  const handleFormSubmit = async (payload, setFieldError) => {
    setSubmitting(true);
    try {
      if (selectedStaff?._id) {
        await staffService.update(selectedStaff._id, payload);
        toast.success('Staff member updated successfully.');
      } else {
        await staffService.create(payload);
        toast.success('Staff member created successfully.');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      if (err.response?.status === 409) {
        setFieldError((prev) => ({
          ...prev,
          email: 'An account with this email address already exists.',
        }));
      } else {
        toast.error(err.response?.data?.message || 'Failed to save staff member.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      await staffService.updateStatus(staff._id, !staff.isActive);
      toast.success(
        `Staff member ${staff.isActive ? 'deactivated' : 'activated'} successfully.`
      );
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update staff status.');
    }
  };

  const handleDelete = async (staff) => {
    try {
      const res = await staffService.delete(staff._id);
      toast.success(res?.message || 'Staff member deleted successfully.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff member.');
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
            <span className="font-semibold text-neutral-900">{row.name}</span>
            <span className="text-[11px] text-neutral-400">
              {row.permissions?.length || 0} permissions assigned
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      className: 'text-neutral-600',
      accessor: 'email',
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
                itemName="Staff Member"
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
        title="Staff Management"
        subtitle="Manage staff accounts and their permissions."
      >
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leadingIcon={Plus}
          >
            Add Staff
          </Button>
        )}
      </PageHeader>

      <ListToolbar
        showTabs={false}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staff..."
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
        data={staffList}
        loading={loading}
        rowKey="_id"
        emptyTitle="No staff members found"
        emptyDescription="Add staff members and configure their module access permissions."
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />

      {/* Staff Modal */}
      <StaffModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        staff={selectedStaff}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />
    </div>
  );
};
