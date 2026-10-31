import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Repeat,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { StatCard } from '../../components/common/StatCard';
import { RevenueBarChart } from '../../components/common/RevenueBarChart';
import { DonutChart } from '../../components/common/DonutChart';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { InvoiceStatusBadge } from '../../components/common/InvoiceStatusBadge';
import { reportService } from './services/reportService';
import { formatCurrency, formatDate } from '../../lib/utils';

export const ReportsPage = () => {
  const navigate = useNavigate();

  // Default range: 1 Jan of current year to today
  const getDefaultRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const from = `${year}-01-01`;
    const to = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return { from, to };
  };

  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (range) => {
    setLoading(true);
    try {
      const res = await reportService.getReports(range);
      setData(res);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(dateRange);
  }, [dateRange, loadData]);

  const handleRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-400 mt-3 font-medium">Generating reports...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const previous = summary.previous;

  // Invoice status donut segments: Paid, Confirmed (labelled "Outstanding"), Overdue, Draft, Cancelled. NO "Unpaid"
  const donutSegments = [
    { name: 'Paid', value: data?.invoiceStatus?.paid || 0, color: '#0b0b0b' },
    { name: 'Outstanding', value: data?.invoiceStatus?.confirmed || 0, color: '#4a4a4a' },
    { name: 'Overdue', value: data?.invoiceStatus?.overdue || 0, color: '#ef4444' },
    { name: 'Draft', value: data?.invoiceStatus?.draft || 0, color: '#c4c4c4' },
    { name: 'Cancelled', value: data?.invoiceStatus?.cancelled || 0, color: '#e5e5e5' },
  ];

  const hasRevenueTrend = Array.isArray(data?.revenueTrend) && data.revenueTrend.length > 0;
  const hasTopCustomers = Array.isArray(data?.topCustomers);

  return (
    <div className="space-y-6">
      {/* Header with DateRangeFilter on the right */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Reports"
          subtitle="View key business metrics and financial summaries."
          className="mb-0"
        />
        <DateRangeFilter initialRange={dateRange} onChange={handleRangeChange} />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.totalRevenue !== undefined && (
          <StatCard
            label="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={CreditCard}
            change={previous?.totalRevenue}
            changeText={previous ? 'vs previous period' : undefined}
            isGoodTrend={true}
          />
        )}
        {summary.activeSubscriptions !== undefined && (
          <StatCard
            label="Active Subscriptions"
            value={summary.activeSubscriptions}
            icon={Repeat}
            change={previous?.activeSubscriptions}
            changeText={previous ? 'vs previous period' : undefined}
            isGoodTrend={true}
          />
        )}
        {summary.outstandingAmount !== undefined && (
          <StatCard
            label="Outstanding Payments"
            value={formatCurrency(summary.outstandingAmount)}
            icon={DollarSign}
            change={previous?.outstandingAmount}
            changeText={previous ? 'vs previous period' : undefined}
            isGoodTrend={false}
          />
        )}
        {summary.overdueInvoices !== undefined && (
          <StatCard
            label="Overdue Invoices"
            value={summary.overdueInvoices}
            icon={AlertTriangle}
            change={previous?.overdueInvoices}
            changeText={previous ? 'vs previous period' : undefined}
            isGoodTrend={false}
          />
        )}
      </div>

      {/* Row 2: Revenue Trend & Invoice Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {hasRevenueTrend ? (
          <>
            <Card className="lg:col-span-7 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Revenue Trend</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Cash collected over selected period</p>
                </div>
                <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                  Monthly
                </span>
              </div>
              <RevenueBarChart data={data.revenueTrend} height={220} />
            </Card>

            <Card className="lg:col-span-5 p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-neutral-900">Invoice Status</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Invoiced amounts status breakdown</p>
              </div>
              <DonutChart data={donutSegments} centerLabel="Total" height={220} />
            </Card>
          </>
        ) : (
          <Card className="lg:col-span-12 p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-neutral-900">Invoice Status</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Invoiced amounts status breakdown</p>
            </div>
            <DonutChart data={donutSegments} centerLabel="Total" height={220} />
          </Card>
        )}
      </div>

      {/* Row 3: Top Customers & Recent Invoices */}
      <div className={`grid grid-cols-1 ${hasTopCustomers ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {/* Top Customers by Revenue (hidden for staff if missing) */}
        {hasTopCustomers && (
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h3 className="text-base font-semibold text-neutral-900">Top Customers by Revenue</h3>
              <Link
                to="/customers"
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
                    <th className="py-3 px-4">Subscriptions</th>
                    <th className="py-3 px-4">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.topCustomers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-neutral-400">
                        No customer revenue records found
                      </td>
                    </tr>
                  ) : (
                    data.topCustomers.map((cust, idx) => (
                      <tr
                        key={cust.customerId || idx}
                        onClick={() => navigate(`/customers/${cust.customerId}`)}
                        className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-neutral-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-900">
                          {cust.name}
                        </td>
                        <td className="py-3 px-4 text-neutral-600">{cust.subscriptions}</td>
                        <td className="py-3 px-4 font-semibold text-neutral-900">
                          {formatCurrency(cust.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Recent Invoices */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100">
            <h3 className="text-base font-semibold text-neutral-900">Recent Invoices</h3>
            <Link
              to="/invoices"
              className="inline-flex items-center text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
            >
              View all <ArrowRight size={13} className="ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/75 text-neutral-500 font-medium border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {(data?.recentInvoices || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-neutral-400">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  data.recentInvoices.map((inv) => (
                    <tr
                      key={inv._id}
                      onClick={() => navigate(`/invoices/${inv._id}`)}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-neutral-800">
                        {inv.customerName}
                      </td>
                      <td className="py-3 px-4 text-neutral-500">
                        {inv.invoiceDate ? formatDate(inv.invoiceDate) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge invoice={inv} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
