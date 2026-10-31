import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Users,
  Repeat,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { StatCard } from '../../components/common/StatCard';
import { RevenueBarChart } from '../../components/common/RevenueBarChart';
import { DonutChart } from '../../components/common/DonutChart';
import { dashboardService } from './services/dashboardService';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getStatusBadgeVariant } from '../../constants/statusStyles';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const result = await dashboardService.getDashboard();
        if (isMounted) setData(result);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-400 mt-3 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-neutral-500">
        Unable to load dashboard data.
      </div>
    );
  }

  // Prepare donut segments for Subscription Status
  const donutSegments = [
    { name: 'Active', value: data.subscriptionStatus?.active || 0, color: '#0b0b0b' },
    { name: 'Paused', value: data.subscriptionStatus?.paused || 0, color: '#8a8a8a' },
    { name: 'Closed', value: data.subscriptionStatus?.closed || 0, color: '#c4c4c4' },
  ];
  if (data.subscriptionStatus?.draft) {
    donutSegments.push({ name: 'Draft', value: data.subscriptionStatus.draft, color: '#e5e5e5' });
  }
  if (data.subscriptionStatus?.confirmed) {
    donutSegments.push({ name: 'Confirmed', value: data.subscriptionStatus.confirmed, color: '#4a4a4a' });
  }

  const hasRevenueTrend = Array.isArray(data.revenueTrend) && data.revenueTrend.length > 0;
  const hasRecentPayments = Array.isArray(data.recentPayments);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Here's what's happening with your business today."
      />

      {/* Row 1: KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {data.totalRevenue !== undefined && (
          <StatCard
            label="Total Revenue"
            value={formatCurrency(data.totalRevenue)}
            icon={CreditCard}
            change={data.changes?.totalRevenue}
            isGoodTrend={true}
          />
        )}
        {data.activeSubscriptions !== undefined && (
          <StatCard
            label="Active Subscriptions"
            value={data.activeSubscriptions}
            icon={Repeat}
            change={data.changes?.activeSubscriptions}
            isGoodTrend={true}
          />
        )}
        {data.totalCustomers !== undefined && (
          <StatCard
            label="Total Customers"
            value={data.totalCustomers}
            icon={Users}
            change={data.changes?.totalCustomers}
            isGoodTrend={true}
          />
        )}
        {data.pendingInvoices !== undefined && (
          <StatCard
            label="Pending Invoices"
            value={data.pendingInvoices}
            icon={Clock}
            change={data.changes?.pendingInvoices}
            isGoodTrend={false}
          />
        )}
        {data.overdueInvoices !== undefined && (
          <StatCard
            label="Overdue Invoices"
            value={data.overdueInvoices}
            icon={AlertTriangle}
            change={data.changes?.overdueInvoices}
            isGoodTrend={false}
          />
        )}
      </div>

      {/* Row 2: Revenue Trend & Subscription Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {hasRevenueTrend ? (
          <>
            <Card className="lg:col-span-7 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Revenue Trend</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Monthly cash collected</p>
                </div>
                <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                  Monthly
                </span>
              </div>
              <RevenueBarChart data={data.revenueTrend} height={220} />
            </Card>

            <Card className="lg:col-span-5 p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-neutral-900">Subscription Status</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Active subscriptions breakdown</p>
              </div>
              <DonutChart data={donutSegments} centerLabel="Total" height={220} />
            </Card>
          </>
        ) : (
          <Card className="lg:col-span-12 p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-neutral-900">Subscription Status</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Active subscriptions breakdown</p>
            </div>
            <DonutChart data={donutSegments} centerLabel="Total" height={220} />
          </Card>
        )}
      </div>

      {/* Row 3: Recent Subscriptions & Recent Payments */}
      <div className={`grid grid-cols-1 ${hasRecentPayments ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {/* Recent Subscriptions */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">Recent Subscriptions</h3>
            <Link
              to="/subscriptions"
              className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              View all <ArrowRight size={13} className="ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(data.recentSubscriptions || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-neutral-400">
                      No recent subscriptions
                    </td>
                  </tr>
                ) : (
                  data.recentSubscriptions.map((sub) => (
                    <tr
                      key={sub._id}
                      onClick={() => navigate(`/subscriptions/${sub._id}`)}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                        {sub.subscriptionNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-800">
                        {sub.customerName}
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{sub.planName}</td>
                      <td className="py-3 px-4 text-neutral-500">
                        {sub.startDate ? formatDate(sub.startDate) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant('subscription', sub.status)}>
                          {sub.status ? sub.status.charAt(0).toUpperCase() + sub.status.slice(1) : '—'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Payments (omitted for staff if missing) */}
        {hasRecentPayments && (
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h3 className="text-base font-semibold text-neutral-900">Recent Payments</h3>
              <Link
                to="/payments"
                className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
              >
                View all <ArrowRight size={13} className="ml-1" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                  <tr>
                    <th className="py-3 px-4">Payment No.</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(data.recentPayments || []).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-neutral-400">
                        No recent payments
                      </td>
                    </tr>
                  ) : (
                    data.recentPayments.map((p) => (
                      <tr
                        key={p._id}
                        onClick={() => navigate('/payments')}
                        className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                          {p.paymentNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-800">
                          {p.customerName}
                        </td>
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-neutral-500">
                          {p.paidAt ? formatDate(p.paidAt) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
