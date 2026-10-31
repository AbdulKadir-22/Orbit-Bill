import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { ListToolbar } from '../../components/common/ListToolbar';
import { RowActions } from '../../components/common/RowActions';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useListQuery } from '../../hooks/useListQuery';
import { productService } from './services/productService';
import { PRODUCT_TYPE_OPTIONS, STATUS_FILTER_OPTIONS } from '../../constants/options';
import { formatCurrency } from '../../lib/utils';
import { ROLES } from '../../constants/roles';

/**
 * ProductsPage (/products)
 */
export const ProductsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = useAuth();
  const isAdmin = role === ROLES.ADMIN;

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
    data: products,
    pagination,
    counts,
    loading,
    refetch,
  } = useListQuery(productService.list, { type: '', isActive: '' });

  const handleToggleStatus = async (product) => {
    try {
      await productService.updateStatus(product._id, !product.isActive);
      toast.success(
        `Product ${product.isActive ? 'deactivated' : 'activated'} successfully.`
      );
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (product) => {
    try {
      const res = await productService.delete(product._id);
      toast.success(res?.message || 'Product deleted successfully.');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete referenced product.');
    }
  };

  const columns = [
    {
      header: '#',
      className: 'w-16 font-mono text-xs text-neutral-400',
      render: (row, idx) => (pagination.page - 1) * pagination.limit + idx + 1,
    },
    {
      header: 'Product Name',
      className: 'font-medium text-neutral-900',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-neutral-900">{row.name}</span>
          {row.notes && (
            <span className="text-xs text-neutral-400 truncate max-w-xs">{row.notes}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      className: 'capitalize text-neutral-600',
      accessor: 'type',
    },
    {
      header: 'Sales Price',
      className: 'font-mono text-neutral-800',
      render: (row) => formatCurrency(row.salesPrice),
    },
    {
      header: 'Cost Price',
      className: 'font-mono text-neutral-500',
      render: (row) => formatCurrency(row.costPrice),
    },
    {
      header: 'Variants',
      className: 'text-neutral-600 font-mono',
      render: (row) => row.variants?.length || 0,
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
                itemName="Product"
                onEdit={() => navigate(`/products/${row._id}/edit`)}
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
        title="Products"
        subtitle="Manage your products and variants."
      >
        {isAdmin && (
          <Link to="/products/new">
            <Button variant="primary" size="md" leadingIcon={Plus}>
              Add Product
            </Button>
          </Link>
        )}
      </PageHeader>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products..."
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        filters={[
          {
            id: 'type',
            value: filters.type,
            onChange: (v) => setFilter('type', v),
            options: PRODUCT_TYPE_OPTIONS,
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
        data={products}
        loading={loading}
        rowKey="_id"
        emptyTitle="No products found"
        emptyDescription="Get started by creating your first product."
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};
