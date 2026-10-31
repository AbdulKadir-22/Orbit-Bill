import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { LinesTable } from '../../components/common/LinesTable';
import { portalService } from './services/portalService';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getStatusBadgeVariant } from '../../constants/statusStyles';

export const MySubscriptionsPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'closed'
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [detailSub, setDetailSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('details'); // 'details' | 'products'

  const [counts, setCounts] = useState({ active: 0, closed: 0 });

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch for active and closed counts
      const [actRes, cloRes] = await Promise.all([
        portalService.getSubscriptions({ status: 'active' }),
        portalService.getSubscriptions({ status: 'closed' }),
      ]);

      const activeList = actRes.data || [];
      const closedList = cloRes.data || [];

      setCounts({
        active: activeList.length,
        closed: closedList.length,
      });

      const currentList = activeTab === 'active' ? activeList : closedList;
      setSubscriptions(currentList);

      if (currentList.length > 0) {
        setSelectedSub(currentList[0]);
      } else {
        setSelectedSub(null);
        setDetailSub(null);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Load detailed subscription when selectedSub changes
  useEffect(() => {
    if (!selectedSub) {
      setDetailSub(null);
      return;
    }
    let isMounted = true;
    (async () => {
      setDetailLoading(true);
      try {
        const full = await portalService.getSubscriptionById(selectedSub._id);
        if (isMounted) setDetailSub(full || selectedSub);
      } catch {
        if (isMounted) setDetailSub(selectedSub);
      } finally {
        if (isMounted) setDetailLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedSub]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subscriptions"
        subtitle="View your subscriptions."
      />

      {/* Tabs: Active (n) | Closed (n) */}
      <div className="flex border-b border-neutral-200 space-x-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'active'
              ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Active ({counts.active})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('closed')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'closed'
              ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Closed ({counts.closed})
        </button>
      </div>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Spinner size="md" />
            <p className="text-xs text-neutral-400 mt-2 font-medium">Loading subscriptions...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-neutral-600">No subscriptions found</p>
            <p className="text-xs text-neutral-400 mt-1">You have no {activeTab} subscriptions at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Billing Cycle</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Next Billing</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {subscriptions.map((sub) => {
                  const isSelected = selectedSub?._id === sub._id;
                  const firstLine = sub.lines?.[0] || {};
                  return (
                    <tr
                      key={sub._id}
                      onClick={() => setSelectedSub(sub)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-neutral-100/70 font-medium' : 'hover:bg-neutral-50/80'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-neutral-900">
                        {sub.subscriptionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-900">
                        {firstLine.planName || sub.planName || 'Plan'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 capitalize">
                        {sub.billingCycle}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {sub.startDate ? formatDate(sub.startDate) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {sub.expiryDate ? formatDate(sub.expiryDate) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-neutral-900">
                        {formatCurrency(sub.grandTotal || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadgeVariant('subscription', sub.status)}>
                          {sub.status ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1) : '—'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Selected Subscription Detail Panel below the table */}
      {selectedSub && (
        <Card className="p-6">
          {detailLoading && !detailSub ? (
            <div className="py-8 flex justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header: subscription number + badge, plan name, dates, View Invoices button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-neutral-100">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-xl font-bold text-neutral-900 font-mono tracking-tight">
                      {detailSub?.subscriptionNumber || selectedSub.subscriptionNumber}
                    </h3>
                    <Badge variant={getStatusBadgeVariant('subscription', detailSub?.status || selectedSub.status)}>
                      {(detailSub?.status || selectedSub.status || '').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    <span className="font-semibold text-neutral-800">
                      {detailSub?.lines?.[0]?.planName || detailSub?.planName || 'Plan'}
                    </span>
                    {' • Started on '}
                    {detailSub?.startDate ? formatDate(detailSub.startDate) : '—'}
                    {detailSub?.nextBillingDate && (
                      <>
                        {' • Renews on '}
                        {formatDate(detailSub.nextBillingDate)}
                      </>
                    )}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/my/invoices?subscriptionId=${selectedSub._id}`)}
                  className="inline-flex items-center text-xs"
                >
                  <FileText size={13} className="mr-1.5" />
                  View Invoices
                </Button>
              </div>

              {/* Sub-tabs: Details | Products (n) */}
              <div className="flex space-x-4 border-b border-neutral-100 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setDetailTab('details')}
                  className={`pb-2 transition-colors ${
                    detailTab === 'details'
                      ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('products')}
                  className={`pb-2 transition-colors ${
                    detailTab === 'products'
                      ? 'text-neutral-900 border-b-2 border-neutral-900 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Products ({detailSub?.lines?.length || selectedSub.lines?.length || 0})
                </button>
              </div>

              {/* Tab Content */}
              {detailTab === 'details' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Subscription Information */}
                  <div className="bg-neutral-50/60 rounded-xl p-5 border border-neutral-100">
                    <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">
                      Subscription Information
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Subscription No.</span>
                        <span className="font-mono font-medium text-neutral-900">
                          {detailSub?.subscriptionNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Plan</span>
                        <span className="font-medium text-neutral-900">
                          {detailSub?.lines?.[0]?.planName || 'Plan'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Billing Cycle</span>
                        <span className="font-medium text-neutral-900 capitalize">
                          {detailSub?.billingCycle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Start Date</span>
                        <span className="text-neutral-800">
                          {detailSub?.startDate ? formatDate(detailSub.startDate) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Expiry Date</span>
                        <span className="text-neutral-800">
                          {detailSub?.expiryDate ? formatDate(detailSub.expiryDate) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Next Billing Date</span>
                        <span className="text-neutral-800">
                          {detailSub?.nextBillingDate ? formatDate(detailSub.nextBillingDate) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Status</span>
                        <Badge variant={getStatusBadgeVariant('subscription', detailSub?.status)}>
                          {detailSub?.status ? detailSub.status.charAt(0).toUpperCase() + detailSub.status.slice(1) : '—'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Payment Terms</span>
                        <span className="text-neutral-800 font-medium capitalize">
                          {detailSub?.paymentTerms || 'Immediate'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-neutral-50/60 rounded-xl p-5 border border-neutral-100">
                    <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">
                      Customer Information
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Name</span>
                        <span className="font-medium text-neutral-900">
                          {detailSub?.customerId?.name || 'Customer'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Email</span>
                        <span className="text-neutral-800">
                          {detailSub?.customerId?.email || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Phone</span>
                        <span className="text-neutral-800">
                          {detailSub?.customerId?.phone || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Company</span>
                        <span className="text-neutral-800">
                          {detailSub?.customerId?.company || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Address</span>
                        <span className="text-neutral-800 text-right max-w-[200px]">
                          {typeof detailSub?.customerId?.address === 'string'
                            ? detailSub.customerId.address
                            : detailSub?.customerId?.billingAddress?.street || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">GSTIN</span>
                        <span className="font-mono text-neutral-800">
                          {detailSub?.customerId?.gstin || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <LinesTable lines={detailSub?.lines || []} />
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
