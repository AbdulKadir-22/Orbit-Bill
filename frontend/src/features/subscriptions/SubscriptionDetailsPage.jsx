import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { subscriptionService } from './services/subscriptionService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Spinner } from '../../components/ui/Spinner';
import { Stepper } from '../../components/common/Stepper';
import { LinesTable } from '../../components/common/LinesTable';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { getStatusBadgeVariant } from '../../constants/statusStyles';
import { formatDate, formatDateTime, formatCurrency } from '../../lib/utils';

export const SubscriptionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();

  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Related data (Phase 5 stubs)
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeRelatedTab, setActiveRelatedTab] = useState('invoices');

  // Edit Drawer
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    startDate: '',
    expiryDate: '',
    paymentTerms: '',
    lines: [],
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Dialogs & Modals
  const [actionConfirm, setActionConfirm] = useState(null); // { type: 'activate'|'pause'|'resume' }
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewPeriods, setRenewPeriods] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const loadSubscription = async () => {
    try {
      const data = await subscriptionService.getById(id);
      setSubscription(data);
      setNotFound(false);
    } catch (err) {
      if (err?.response?.status === 404 || err?.status === 404) {
        setNotFound(true);
      } else {
        showErrorToast(err?.message || 'Failed to load subscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = () => {
    subscriptionService.getInvoices(id, 10).then(setInvoices);
    subscriptionService.getPayments(id, 10).then(setPayments);
  };

  useEffect(() => {
    loadSubscription();
    loadRelatedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound || !subscription) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0b0b0b]">Subscription not found</h2>
        <p className="text-sm text-[#737373]">The requested subscription does not exist or has been removed.</p>
        <div>
          <Button variant="primary" onClick={() => navigate('/subscriptions')}>
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  // Stepper Construction
  // Steps: Draft -> Quotation -> Confirmed -> Active -> Closed
  const history = subscription.statusHistory || [];
  const findDateForStatus = (statusKey) => {
    const entry = history.find((h) => h.to === statusKey || h.action === statusKey);
    return entry?.at ? formatDate(entry.at) : null;
  };

  const currentStep = subscription.status;
  const isPaused = currentStep === 'paused';
  const effectiveStepperStatus = isPaused ? 'active' : currentStep;

  const steps = [
    {
      key: 'draft',
      label: 'Draft',
      date: findDateForStatus('draft') || formatDate(subscription.createdAt),
    },
    {
      key: 'quotation',
      label: 'Quotation',
      date: findDateForStatus('quotation'),
    },
    {
      key: 'confirmed',
      label: 'Confirmed',
      date: findDateForStatus('confirmed'),
    },
    {
      key: 'active',
      label: 'Active',
      date: findDateForStatus('active') || (['active', 'paused', 'closed'].includes(subscription.status) ? formatDate(subscription.startDate) : null),
    },
    {
      key: 'closed',
      label: 'Closed',
      date: findDateForStatus('closed') || (subscription.closedAt ? formatDate(subscription.closedAt) : null),
    },
  ];

  // Plan capability flags from lines
  // Note: subscription lines store plan snapshots, or we check plan properties
  const lines = subscription.lines || [];
  const firstLine = lines[0] || {};
  const allowPause = lines.every((l) => l.planId?.allowPause !== false);
  const allowRenewal = lines.every((l) => l.planId?.allowRenewal !== false);
  const allowEarlyClose = lines.every((l) => l.planId?.allowEarlyClose !== false);

  // Handlers for Lifecycle Actions
  const handleActivate = async () => {
    setIsActionLoading(true);
    try {
      await subscriptionService.activate(id);
      showSuccessToast('Subscription activated successfully');
      setActionConfirm(null);
      loadSubscription();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to activate subscription');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePause = async () => {
    setIsActionLoading(true);
    try {
      await subscriptionService.pause(id, { reason: 'Paused by operator' });
      showSuccessToast('Subscription paused');
      setActionConfirm(null);
      loadSubscription();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to pause subscription');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResume = async () => {
    setIsActionLoading(true);
    try {
      await subscriptionService.resume(id);
      showSuccessToast('Subscription resumed');
      setActionConfirm(null);
      loadSubscription();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to resume subscription');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      await subscriptionService.renew(id, { periods: renewPeriods });
      showSuccessToast('Subscription renewed');
      setRenewModalOpen(false);
      loadSubscription();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to renew subscription');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleClose = async () => {
    if (!closeReason.trim()) {
      showErrorToast('Reason is required to close subscription');
      return;
    }
    setIsClosing(true);
    try {
      await subscriptionService.close(id, { reason: closeReason.trim() });
      showSuccessToast('Subscription closed');
      setCloseModalOpen(false);
      setCloseReason('');
      loadSubscription();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to close subscription');
    } finally {
      setIsClosing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await subscriptionService.delete(id);
      showSuccessToast('Subscription deleted');
      navigate('/subscriptions');
    } catch (err) {
      showErrorToast(err?.message || 'Failed to delete subscription');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(false);
    }
  };

  // Open Edit Drawer
  const openEditDrawer = () => {
    setEditFormData({
      startDate: subscription.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : '',
      expiryDate: subscription.expiryDate ? new Date(subscription.expiryDate).toISOString().split('T')[0] : '',
      paymentTerms: subscription.paymentTerms || 'Net 15',
      lines: (subscription.lines || []).map((l) => ({
        _id: l._id,
        productId: l.productId?._id || l.productId,
        productName: l.productName,
        planId: l.planId?._id || l.planId,
        planName: l.planName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxId: l.taxId?._id || l.taxId,
      })),
    });
    setMoreMenuOpen(false);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const payload = {
        startDate: editFormData.startDate ? new Date(editFormData.startDate).toISOString() : undefined,
        expiryDate: editFormData.expiryDate ? new Date(editFormData.expiryDate).toISOString() : undefined,
        paymentTerms: editFormData.paymentTerms,
        lines: editFormData.lines.map((l) => ({
          productId: l.productId,
          planId: l.planId,
          quantity: Number(l.quantity),
          taxId: l.taxId || undefined,
        })),
      };
      await subscriptionService.update(id, payload);
      showSuccessToast('Subscription updated successfully');
      setIsEditOpen(false);
      loadSubscription();
    } catch (err) {
      showErrorToast(err?.message || 'Failed to update subscription');
    } finally {
      setSavingEdit(false);
    }
  };

  const canEdit = ['draft', 'confirmed'].includes(subscription.status);
  const isDraft = subscription.status === 'draft';
  const isAdmin = role === ROLES.ADMIN;

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumb */}
      <div>
        <div className="text-xs text-[#737373] mb-1">
          <Link to="/subscriptions" className="hover:underline">
            Subscriptions
          </Link>{' '}
          &gt; {subscription.subscriptionNumber}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#0b0b0b]">
                {subscription.subscriptionNumber}
              </h1>
              <Badge variant={getStatusBadgeVariant('subscription', subscription.status)}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
            </div>
            <div className="text-sm text-[#525252] mt-1">
              Customer:{' '}
              <Link
                to={`/customers/${subscription.customerId?._id || subscription.customerId}`}
                className="font-medium text-[#0b0b0b] hover:underline"
              >
                {subscription.customerId?.name || 'Customer'}
              </Link>
            </div>
          </div>

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            >
              Actions
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </Button>

            {moreMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white border border-[#e5e5e5] rounded-lg shadow-lg py-1 z-30"
                onClick={() => setMoreMenuOpen(false)}
              >
                {canEdit && (
                  <button
                    onClick={openEditDrawer}
                    className="w-full text-left px-4 py-2 text-sm text-[#171717] hover:bg-[#f5f5f5]"
                  >
                    Edit Subscription
                  </button>
                )}
                {isDraft && isAdmin && (
                  <button
                    onClick={() => setDeleteTarget(true)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete Subscription
                  </button>
                )}
                {!canEdit && !(isDraft && isAdmin) && (
                  <div className="px-4 py-2 text-xs text-[#737373]">No additional actions</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stepper Card */}
      <Card className="p-6">
        <Stepper
          steps={steps}
          currentStep={effectiveStepperStatus}
          extraBadge={isPaused ? 'Paused' : null}
        />
      </Card>

      {/* Subscription Information & Lifecycle Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Subscription Information */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#171717]">Subscription Information</h2>
          <div className="divide-y divide-[#f0f0f0] text-sm">
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Customer</span>
              <span className="font-medium text-[#171717]">{subscription.customerId?.name || '—'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Plan</span>
              <span className="font-medium text-[#171717]">{firstLine.planName || 'Standard'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Billing Cycle</span>
              <span className="font-medium text-[#171717] capitalize">
                {subscription.billingCycle || 'Monthly'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Start Date</span>
              <span className="font-medium text-[#171717]">{formatDate(subscription.startDate)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Expiry Date</span>
              <span className="font-medium text-[#171717]">{formatDate(subscription.expiryDate)}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Next Billing Date</span>
              <span className="font-medium text-[#171717]">
                {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : '—'}
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Payment Terms</span>
              <span className="font-medium text-[#171717]">{subscription.paymentTerms || 'Net 15'}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-[#737373]">Status</span>
              <Badge variant={getStatusBadgeVariant('subscription', subscription.status)}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Created By</span>
              <span className="font-medium text-[#171717]">{subscription.createdBy?.name || 'Admin User'}</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#737373]">Created At</span>
              <span className="font-medium text-[#171717]">{formatDateTime(subscription.createdAt)}</span>
            </div>
            {subscription.status === 'closed' && (
              <>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#737373]">Closed At</span>
                  <span className="font-medium text-[#171717]">{formatDateTime(subscription.closedAt)}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#737373]">Close Reason</span>
                  <span className="font-medium text-[#171717]">{subscription.closeReason || '—'}</span>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Right Card: Lifecycle Actions */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-[#171717]">Actions</h2>

          {/* Draft or Confirmed: Activate */}
          {['draft', 'confirmed'].includes(subscription.status) && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-[#737373]">
                Activate this subscription to schedule automated recurring invoicing starting from its start date.
              </p>
              <Button
                variant="primary"
                className="w-full h-11"
                onClick={() => setActionConfirm({ type: 'activate' })}
              >
                Activate Subscription
              </Button>
            </div>
          )}

          {/* Active: Pause, Renew, Close */}
          {subscription.status === 'active' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {allowPause && (
                <Button
                  variant="secondary"
                  className="h-11 flex items-center justify-center gap-1.5"
                  onClick={() => setActionConfirm({ type: 'pause' })}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pause
                </Button>
              )}
              {allowRenewal && (
                <Button
                  variant="secondary"
                  className="h-11 flex items-center justify-center gap-1.5"
                  onClick={() => {
                    setRenewPeriods(1);
                    setRenewModalOpen(true);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Renew
                </Button>
              )}
              {allowEarlyClose && (
                <Button
                  variant="ghost"
                  className="h-11 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
                  onClick={() => setCloseModalOpen(true)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </Button>
              )}
            </div>
          )}

          {/* Paused: Resume, Close */}
          {subscription.status === 'paused' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                className="h-11 flex items-center justify-center gap-1.5"
                onClick={() => setActionConfirm({ type: 'resume' })}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume
              </Button>
              {allowEarlyClose && (
                <Button
                  variant="ghost"
                  className="h-11 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
                  onClick={() => setCloseModalOpen(true)}
                >
                  Close
                </Button>
              )}
            </div>
          )}

          {/* Closed: message */}
          {subscription.status === 'closed' && (
            <div className="py-6 text-center text-sm text-[#737373]">
              This subscription is closed.
            </div>
          )}
        </Card>
      </div>

      {/* Subscription Items Card */}
      <Card className="p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#171717]">Subscription Items</h2>
        <LinesTable lines={subscription.lines} />
      </Card>

      {/* Tabs Card: Invoices & Payments (Phase 5 Stubs) */}
      <Card className="p-6 space-y-4">
        <div className="flex border-b border-[#e5e5e5]">
          <button
            onClick={() => setActiveRelatedTab('invoices')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeRelatedTab === 'invoices'
                ? 'border-[#0b0b0b] text-[#0b0b0b] font-semibold'
                : 'border-transparent text-[#737373] hover:text-[#171717]'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveRelatedTab('payments')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeRelatedTab === 'payments'
                ? 'border-[#0b0b0b] text-[#0b0b0b] font-semibold'
                : 'border-transparent text-[#737373] hover:text-[#171717]'
            }`}
          >
            Payments ({payments.length})
          </button>
        </div>

        {activeRelatedTab === 'invoices' && (
          <div>
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#737373]">
                Nothing here yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e5e5] text-xs font-semibold text-[#737373] uppercase">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Invoice No.</th>
                      <th className="py-2.5 px-3">Invoice Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {invoices.map((inv, idx) => (
                      <tr
                        key={inv._id || idx}
                        onClick={() => navigate(`/invoices/${inv._id}`)}
                        className="cursor-pointer hover:bg-[#fafafa]"
                      >
                        <td className="py-3 px-3 text-xs text-[#737373] font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-[#0b0b0b] font-mono">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 text-[#525252]">{formatDate(inv.invoiceDate || inv.createdAt)}</td>
                        <td className="py-3 px-3 text-[#525252]">{formatDate(inv.dueDate)}</td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-[#171717]">{formatCurrency(inv.total)}</td>
                        <td className="py-3 px-3">
                          <Badge variant={getStatusBadgeVariant('invoice', inv.status)}>
                            {inv.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeRelatedTab === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#737373]">
                Nothing here yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e5e5] text-xs font-semibold text-[#737373] uppercase">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Payment No.</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {payments.map((pmt, idx) => (
                      <tr key={pmt._id || idx} className="hover:bg-[#fafafa]">
                        <td className="py-3 px-3 text-xs text-[#737373] font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-[#0b0b0b] font-mono">{pmt.paymentNumber || `PAY-${idx + 1}`}</td>
                        <td className="py-3 px-3 text-[#525252]">{formatDate(pmt.paymentDate || pmt.createdAt)}</td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-[#171717]">{formatCurrency(pmt.amount)}</td>
                        <td className="py-3 px-3 text-[#525252] capitalize">{pmt.paymentMethod || 'Bank Transfer'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit Drawer */}
      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Subscription"
        description="Modify subscription dates, payment terms, and line quantities."
        size="lg"
      >
        <div className="flex flex-col h-full space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={editFormData.startDate}
              onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={editFormData.expiryDate}
              onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
            />
          </div>

          <Input
            label="Payment Terms"
            placeholder="e.g. Net 15, Net 30"
            value={editFormData.paymentTerms}
            onChange={(e) => setEditFormData({ ...editFormData, paymentTerms: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-2">Line Items (Quantity)</label>
            <div className="divide-y divide-[#f0f0f0] border border-[#e5e5e5] rounded-lg">
              {editFormData.lines.map((line, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-[#171717]">{line.productName}</div>
                    <div className="text-xs text-[#737373]">{line.planName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#737373]">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...editFormData.lines];
                        updated[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setEditFormData({ ...editFormData, lines: updated });
                      }}
                      className="w-20 h-9 px-2 bg-white border border-[#d4d4d4] rounded text-center text-sm text-[#171717]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#e5e5e5] mt-auto">
            <Button variant="secondary" onClick={() => setIsEditOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} isLoading={savingEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Confirm Activate, Pause, Resume */}
      <ConfirmDialog
        isOpen={!!actionConfirm}
        title={
          actionConfirm?.type === 'activate'
            ? 'Activate Subscription'
            : actionConfirm?.type === 'pause'
            ? 'Pause Subscription'
            : 'Resume Subscription'
        }
        message={
          actionConfirm?.type === 'activate'
            ? 'Are you sure you want to activate this subscription? First billing will be scheduled on the start date.'
            : actionConfirm?.type === 'pause'
            ? 'Are you sure you want to pause this subscription? Recurring billing will be held.'
            : 'Are you sure you want to resume this subscription? Invoicing will resume.'
        }
        confirmText={
          actionConfirm?.type === 'activate'
            ? 'Activate'
            : actionConfirm?.type === 'pause'
            ? 'Pause'
            : 'Resume'
        }
        confirmVariant={actionConfirm?.type === 'pause' ? 'warning' : 'primary'}
        isLoading={isActionLoading}
        onConfirm={
          actionConfirm?.type === 'activate'
            ? handleActivate
            : actionConfirm?.type === 'pause'
            ? handlePause
            : handleResume
        }
        onClose={() => setActionConfirm(null)}
      />

      {/* Close Modal */}
      <Modal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        title="Close Subscription"
        description="Provide a reason for closing this subscription."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation due to company restructuring"
              className="w-full px-3 py-2 bg-white border border-[#d4d4d4] rounded-lg text-sm text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#0b0b0b]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCloseModalOpen(false)} disabled={isClosing}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleClose}
              isLoading={isClosing}
              disabled={!closeReason.trim()}
            >
              Close Subscription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Renew Modal */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renew Subscription"
        description="Extend this subscription for additional billing cycles."
      >
        <div className="space-y-4">
          <Input
            label="Renewal Periods"
            type="number"
            min="1"
            value={renewPeriods}
            onChange={(e) => setRenewPeriods(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />

          <div className="text-xs text-[#737373]">
            Current Expiry: <span className="font-medium text-[#171717]">{formatDate(subscription.expiryDate)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setRenewModalOpen(false)} disabled={isRenewing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRenew} isLoading={isRenewing}>
              Renew Subscription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteTarget}
        title="Delete Subscription"
        message={`Are you sure you want to delete draft subscription ${subscription.subscriptionNumber}? This action cannot be undone.`}
        confirmText="Delete Subscription"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(false)}
      />
    </div>
  );
};
