import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  Receipt,
  Repeat,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { Drawer } from '../../components/ui/Drawer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { CustomerForm } from './components/CustomerForm';
import { customerService } from './services/customerService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatCurrency } from '../../lib/utils';
import { getStatusBadgeVariant } from '../../constants/statusStyles';
import { ROLES } from '../../constants/roles';

/**
 * CustomerDetailsPage (/customers/:id)
 */
export const CustomerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = useAuth();
  const canManage = role === ROLES.ADMIN || role === ROLES.STAFF;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'quotations' | 'invoices'

  // Related data
  const [subscriptions, setSubscriptions] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  // Fetch Customer
  useEffect(() => {
    const fetchCustomer = async () => {
      setLoading(true);
      try {
        const data = await customerService.getById(id);
        if (!data) {
          setCustomer(null);
        } else {
          setCustomer(data);
        }
      } catch {
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  // Fetch related data in parallel (independently failing safely)
  useEffect(() => {
    if (!id) return;
    customerService.getSubscriptions(id, 10).then(setSubscriptions);
    customerService.getQuotations(id, 10).then(setQuotations);
    customerService.getInvoices(id, 10).then(setInvoices);
    customerService.getPayments(id, 10).then(setPayments);
  }, [id]);

  const handleUpdateCustomer = async (payload, setFieldError) => {
    setSubmitting(true);
    try {
      const updated = await customerService.update(id, payload);
      setCustomer(updated);
      toast.success('Customer profile updated.');
      setDrawerOpen(false);
    } catch (err) {
      if (err.response?.status === 409) {
        setFieldError((prev) => ({ ...prev, email: 'Email is already in use.' }));
      } else {
        toast.error(err.response?.data?.message || 'Failed to update customer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const updated = await customerService.updateStatus(id, !customer.isActive);
      setCustomer(updated);
      toast.success(
        `Customer ${updated.isActive ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    try {
      await customerService.delete(id);
      toast.success('Customer deleted.');
      navigate('/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Customer Not Found</h2>
        <p className="text-sm text-neutral-500">
          The requested customer could not be found or has been removed.
        </p>
        <Link to="/customers">
          <Button variant="secondary" size="sm">
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  // Address formatting
  const addr = customer.address || {};
  const addressParts = [
    addr.line1 || addr.street,
    addr.city,
    addr.state,
    addr.pincode || addr.postalCode,
    addr.country,
  ].filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-black/[0.06]">
        <div>
          <nav className="text-xs text-neutral-400 mb-1 flex items-center gap-1.5">
            <Link to="/customers" className="hover:text-black transition-colors">
              Customers
            </Link>
            <span>›</span>
            <span className="text-neutral-700 font-medium">{customer.name}</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {customer.name}
            </h1>
            <Badge variant={customer.isActive ? 'success' : 'danger'}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Customer since {formatDate(customer.createdAt) || 'Recent'}
          </p>
        </div>

        {/* Right side actions */}
        {canManage && (
          <div className="flex items-center gap-2 relative">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDrawerOpen(true)}
              leadingIcon={Edit2}
            >
              Edit Customer
            </Button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                className="p-2 rounded-[10px] border border-black/10 bg-white hover:bg-neutral-50 text-neutral-700 cursor-pointer"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-[12px] shadow-xl border border-black/10 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      handleToggleStatus();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors text-left cursor-pointer"
                  >
                    {customer.isActive ? (
                      <>
                        <ToggleRight size={14} className="text-amber-600" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={14} className="text-emerald-600" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  <div className="h-[1px] bg-black/5 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setMoreMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <Avatar name={customer.name} size="xl" />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {/* Contact Details */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Contact Information
              </h3>
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                <Mail size={15} className="text-neutral-400 shrink-0" />
                <a href={`mailto:${customer.email}`} className="hover:underline">
                  {customer.email}
                </a>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-neutral-800 font-mono">
                  <Phone size={15} className="text-neutral-400 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>

            {/* Company & Tax */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Company & GSTIN
              </h3>
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                <Building size={15} className="text-neutral-400 shrink-0" />
                <span>{customer.company || 'Individual Account'}</span>
              </div>
              {customer.gstin && (
                <div className="text-xs font-mono text-neutral-600">
                  <span className="text-neutral-400">GSTIN: </span>
                  <span className="font-semibold">{customer.gstin}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Billing Address
              </h3>
              {addressParts.length > 0 ? (
                <div className="flex items-start gap-2 text-sm text-neutral-700 leading-relaxed">
                  <MapPin size={15} className="text-neutral-400 shrink-0 mt-0.5" />
                  <span>{addressParts.join(', ')}</span>
                </div>
              ) : (
                <p className="text-xs text-neutral-400">No address recorded</p>
              )}
            </div>
          </div>
        </div>

        {customer.notes && (
          <div className="mt-6 pt-4 border-t border-black/5 text-xs text-neutral-600 bg-neutral-50/70 p-3 rounded-[10px]">
            <span className="font-semibold text-neutral-800 block mb-1">Notes:</span>
            {customer.notes}
          </div>
        )}
      </Card>

      {/* Tabs Card: Subscriptions (n) | Quotations (n) | Invoices (n) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/10 pb-4 mb-4">
          <div className="flex items-center gap-6">
            {[
              { id: 'subscriptions', label: `Subscriptions (${subscriptions.length})` },
              { id: 'quotations', label: `Quotations (${quotations.length})` },
              { id: 'invoices', label: `Invoices (${invoices.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-semibold transition-all relative cursor-pointer pb-1 ${
                  activeTab === tab.id
                    ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-[17px]'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link to={`/quotations/new?customerId=${customer._id}`}>
            <Button variant="primary" size="sm" leadingIcon={Plus}>
              New Quotation
            </Button>
          </Link>
        </div>

        {/* Tab Content */}
        {activeTab === 'subscriptions' && (
          subscriptions.length === 0 ? (
            <EmptyState
              icon={Repeat}
              title="No subscriptions"
              description="This customer does not have any active or past subscriptions yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/5 text-neutral-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Plan</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3">Next Billing</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {subscriptions.map((sub, idx) => {
                    const firstPlanName = sub.lines?.[0]?.planId?.name || sub.planName || 'Plan';
                    const moreCount = (sub.lines?.length || 1) - 1;
                    return (
                      <tr
                        key={sub._id || idx}
                        onClick={() => navigate(`/subscriptions/${sub._id}`)}
                        className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-mono font-semibold text-neutral-800">
                          {sub.subscriptionNumber || `SUB-${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 text-neutral-800">
                          {firstPlanName} {moreCount > 0 && `+${moreCount} more`}
                        </td>
                        <td className="py-3 px-3 text-neutral-600">{formatDate(sub.startDate)}</td>
                        <td className="py-3 px-3 text-neutral-600">{formatDate(sub.endDate) || '—'}</td>
                        <td className="py-3 px-3 text-neutral-600">{formatDate(sub.nextBillingDate) || '—'}</td>
                        <td className="py-3 px-3">
                          <Badge variant={getStatusBadgeVariant('subscription', sub.status)}>
                            {sub.status || 'Active'}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-neutral-900">
                          {formatCurrency(sub.grandTotal || sub.amount || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'quotations' && (
          quotations.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No quotations"
              description="No quotation proposals have been generated for this customer."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/5 text-neutral-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Quote #</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3">Valid Until</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {quotations.map((q, idx) => (
                    <tr
                      key={q._id || idx}
                      onClick={() => navigate(`/quotations/${q._id}`)}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-neutral-800">
                        {q.quotationNumber || `QT-${idx + 1}`}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">{formatDate(q.createdAt)}</td>
                      <td className="py-3 px-3 text-neutral-600">{formatDate(q.validUntil) || '—'}</td>
                      <td className="py-3 px-3">
                        <Badge variant={getStatusBadgeVariant('quotation', q.status)}>
                          {q.status || 'Draft'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-neutral-900">
                        {formatCurrency(q.grandTotal || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'invoices' && (
          invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices"
              description="No invoices found for this customer record."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/5 text-neutral-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Amount Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {invoices.map((inv, idx) => (
                    <tr
                      key={inv._id || idx}
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-neutral-800">
                        {inv.invoiceNumber || `INV-${idx + 1}`}
                      </td>
                      <td className="py-3 px-3 text-neutral-600">{formatDate(inv.invoiceDate || inv.createdAt)}</td>
                      <td className="py-3 px-3 text-neutral-600">{formatDate(inv.dueDate) || '—'}</td>
                      <td className="py-3 px-3">
                        <Badge variant={getStatusBadgeVariant('invoice', inv.status)}>
                          {inv.status || 'Draft'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-neutral-900">{formatCurrency(inv.grandTotal || 0)}</td>
                      <td className="py-3 px-3 font-mono font-semibold text-rose-600">
                        {formatCurrency(inv.amountDue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      {/* Side-by-Side Cards: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Recent Invoices</h3>
            <Link
              to={`/invoices?customerId=${customer._id}`}
              className="text-xs font-medium text-neutral-600 hover:text-black transition-colors"
            >
              View all →
            </Link>
          </div>

          {invoices.slice(0, 3).length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No recent invoices recorded</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 3).map((inv, idx) => (
                <div
                  key={inv._id || idx}
                  onClick={() => navigate(`/invoices/${inv._id}`)}
                  className="flex items-center justify-between p-3 rounded-[10px] bg-neutral-50/70 hover:bg-neutral-100/70 cursor-pointer transition-colors text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-mono font-semibold text-neutral-900">
                      {inv.invoiceNumber || `INV-${idx + 1}`}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {formatDate(inv.invoiceDate || inv.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-neutral-900">
                      {formatCurrency(inv.grandTotal || 0)}
                    </span>
                    <Badge variant={getStatusBadgeVariant('invoice', inv.status)} size="sm">
                      {inv.status || 'Draft'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Payments */}
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Recent Payments</h3>
            <Link
              to={`/payments?customerId=${customer._id}`}
              className="text-xs font-medium text-neutral-600 hover:text-black transition-colors"
            >
              View all →
            </Link>
          </div>

          {payments.slice(0, 3).length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No recent payments recorded</p>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 3).map((pay, idx) => (
                <div
                  key={pay._id || idx}
                  className="flex items-center justify-between p-3 rounded-[10px] bg-neutral-50/70 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-mono font-semibold text-neutral-900">
                      {pay.paymentNumber || `PAY-${idx + 1}`}
                    </span>
                    <span className="text-[11px] text-neutral-500">{formatDate(pay.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-emerald-600">
                      {formatCurrency(pay.amount || 0)}
                    </span>
                    <span className="text-xs text-neutral-600 capitalize">
                      {pay.method || pay.paymentMethod || 'Card'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Customer Drawer for Editing */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Edit Customer"
        position="right"
        maxWidth="max-w-lg"
      >
        <CustomerForm
          customer={customer}
          onSubmit={handleUpdateCustomer}
          onCancel={() => setDrawerOpen(false)}
          submitting={submitting}
        />
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Customer?"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
