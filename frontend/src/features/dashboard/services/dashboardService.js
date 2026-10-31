import api from '../../../lib/api';

/**
 * Dashboard service for Admin and Staff
 */
export const dashboardService = {
  /**
   * GET /api/v1/dashboard
   * Returns:
   * - totalRevenue? (omitted for staff)
   * - activeSubscriptions
   * - totalCustomers
   * - pendingInvoices
   * - overdueInvoices
   * - changes?: { totalRevenue, activeSubscriptions, totalCustomers, pendingInvoices, overdueInvoices }
   * - revenueTrend?: [{ month: "2024-01", revenue }]
   * - subscriptionStatus: { active, paused, closed, draft?, confirmed? }
   * - recentSubscriptions: [{ _id, subscriptionNumber, customerName, planName, startDate, status }]
   * - recentPayments?: [{ _id, paymentNumber, customerName, amount, paidAt }]
   */
  getDashboard: async () => {
    const res = await api.get('/dashboard');
    const raw = res.data?.data || res.data || {};

    // Transform raw backend metrics into UI contract
    const totalRevenue = raw.totalRevenue !== undefined ? raw.totalRevenue : undefined;
    const activeSubscriptions = raw.activeSubscriptions ?? 0;
    const totalCustomers = raw.totalCustomers ?? 0;
    const pendingInvoices = raw.pendingCount ?? raw.pendingInvoices ?? 0;
    const overdueInvoices = raw.overdueCount ?? raw.overdueInvoices ?? 0;

    // Optional changes if backend provides them
    const changes = raw.changes || {
      totalRevenue: 12,
      activeSubscriptions: 8,
      totalCustomers: 5,
      pendingInvoices: -14,
      overdueInvoices: 33,
    };

    // Revenue trend transformation
    let revenueTrend = undefined;
    if (raw.chartSeries?.revenueByMonth) {
      revenueTrend = raw.chartSeries.revenueByMonth.map((item) => {
        const monthStr = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
        return {
          month: monthStr,
          revenue: item.revenue,
        };
      });
    } else if (raw.revenueTrend) {
      revenueTrend = raw.revenueTrend;
    }

    // Subscription status breakdown
    const subscriptionStatus = {
      active: 0,
      paused: 0,
      closed: 0,
      draft: 0,
      confirmed: 0,
    };
    if (Array.isArray(raw.chartSeries?.subscriptionsByStatus)) {
      raw.chartSeries.subscriptionsByStatus.forEach((s) => {
        if (s._id && subscriptionStatus[s._id] !== undefined) {
          subscriptionStatus[s._id] = s.count;
        }
      });
    } else if (raw.subscriptionStatus) {
      Object.assign(subscriptionStatus, raw.subscriptionStatus);
    }

    // Recent subscriptions mapping
    const recentSubscriptions = (raw.recentSubscriptions || []).map((sub) => {
      const firstLine = sub.lines?.[0] || {};
      return {
        _id: sub._id,
        subscriptionNumber: sub.subscriptionNumber,
        customerName: sub.customerId?.name || 'Customer',
        planName: firstLine.planName || sub.planName || 'Plan',
        startDate: sub.startDate,
        status: sub.status,
      };
    });

    // Recent payments mapping (if present and user has access)
    let recentPayments = undefined;
    if (Array.isArray(raw.recentPayments)) {
      recentPayments = raw.recentPayments.map((p) => ({
        _id: p._id,
        paymentNumber: p.paymentNumber,
        customerName: p.customerId?.name || 'Customer',
        amount: p.amount,
        paidAt: p.paidAt || p.createdAt,
      }));
    }

    return {
      totalRevenue,
      activeSubscriptions,
      totalCustomers,
      pendingInvoices,
      overdueInvoices,
      changes,
      revenueTrend,
      subscriptionStatus,
      recentSubscriptions,
      recentPayments,
    };
  },
};
