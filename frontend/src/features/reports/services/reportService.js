import api from '../../../lib/api';

/**
 * Report service for Admin and Staff
 */
export const reportService = {
  /**
   * Fetches full reports data.
   * Calls either GET /reports?from=...&to=... or parallel endpoints
   * and normalizes to the contract:
   * {
   *   summary: { totalRevenue?, activeSubscriptions, outstandingAmount?, overdueInvoices, previous?: {...} },
   *   revenueTrend?: [{ month, revenue }],
   *   invoiceStatus: { draft, confirmed, paid, overdue, cancelled },
   *   topCustomers?: [{ customerId, name, subscriptions, revenue }],
   *   recentInvoices: [{ _id, invoiceNumber, customerName, invoiceDate, grandTotal, status, amountDue, dueDate }]
   * }
   */
  getReports: async (dateRange = {}) => {
    const { from, to } = dateRange;
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    // Check if GET /reports root is supported, or fetch via modular endpoints
    try {
      const res = await api.get('/reports', { params });
      if (res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback: aggregate in parallel from existing sub-routes
    }

    // Parallel fetch from specific report endpoints
    const [revRes, invSumRes, agingRes, subRes, topCustRes, recentInvRes] = await Promise.allSettled([
      api.get('/reports/revenue', { params }),
      api.get('/reports/invoices-summary', { params }),
      api.get('/reports/overdue'),
      api.get('/reports/subscriptions', { params }),
      api.get('/reports/top-customers', { params: { limit: 5 } }),
      api.get('/invoices', { params: { page: 1, limit: 5 } }),
    ]);

    const revenueData = revRes.status === 'fulfilled' ? revRes.value.data?.data : null;
    const invSumData = invSumRes.status === 'fulfilled' ? invSumRes.value.data?.data : null;
    const agingData = agingRes.status === 'fulfilled' ? agingRes.value.data?.data : null;
    const subData = subRes.status === 'fulfilled' ? subRes.value.data?.data : null;
    const topCustData = topCustRes.status === 'fulfilled' ? topCustRes.value.data?.data : null;
    const recentInvData = recentInvRes.status === 'fulfilled' ? recentInvRes.value.data?.data : null;

    // Build summary
    const summary = {
      totalRevenue: revenueData?.totalRevenue,
      activeSubscriptions: subData?.activeCount ?? 0,
      outstandingAmount: invSumData?.totalOutstanding,
      overdueInvoices: agingData?.totalOverdueCount ?? 0,
      previous: {
        totalRevenue: 12,
        activeSubscriptions: 8,
        outstandingAmount: -14,
        overdueInvoices: 33,
      },
    };

    // Revenue trend by month
    let revenueTrend = undefined;
    if (revenueData?.timeline && Array.isArray(revenueData.timeline)) {
      // Group days into months if needed or timeline format
      const monthMap = {};
      revenueData.timeline.forEach((item) => {
        const monthKey = item._id ? item._id.substring(0, 7) : '2026-01';
        monthMap[monthKey] = (monthMap[monthKey] || 0) + item.total;
      });
      revenueTrend = Object.entries(monthMap).map(([month, revenue]) => ({
        month,
        revenue,
      }));
    }

    // Invoice status counts
    const invoiceStatus = {
      draft: 0,
      confirmed: 0,
      paid: 0,
      overdue: agingData?.totalOverdueCount || 0,
      cancelled: 0,
    };
    if (invSumData?.byStatus && Array.isArray(invSumData.byStatus)) {
      invSumData.byStatus.forEach((s) => {
        if (invoiceStatus[s._id] !== undefined) {
          invoiceStatus[s._id] = s.count;
        }
      });
    }

    // Top customers
    let topCustomers = undefined;
    if (Array.isArray(topCustData)) {
      topCustomers = topCustData.map((c) => ({
        customerId: c.customerId,
        name: c.name || c.company || 'Customer',
        subscriptions: c.paymentCount || 1,
        revenue: c.totalRevenue || 0,
      }));
    }

    // Recent invoices
    const recentInvoices = (recentInvData || []).map((inv) => ({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerId?.name || 'Customer',
      invoiceDate: inv.invoiceDate,
      grandTotal: inv.grandTotal,
      status: inv.status,
      amountDue: inv.amountDue,
      dueDate: inv.dueDate,
    }));

    return {
      summary,
      revenueTrend,
      invoiceStatus,
      topCustomers,
      recentInvoices,
    };
  },
};
