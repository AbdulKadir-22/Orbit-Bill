const Payment = require('../payments/payment.model');
const Invoice = require('../invoices/invoice.model');
const Subscription = require('../subscriptions/subscription.model');
const Customer = require('../customers/customer.model');
const { startOfDay } = require('../../utils/dates');
const { roundMoney } = require('../../utils/pricing');
const ROLES = require('../../constants/roles');
const env = require('../../config/env');

// In-memory role-keyed dashboard cache
const dashboardCache = new Map();

const invalidateDashboardCache = () => {
  dashboardCache.clear();
};

/**
 * Aggregates high-performance dashboard statistics using MongoDB $facet.
 *
 * @param {Object} user - Authenticated user
 * @returns {Promise<Object>}
 */
const getDashboardMetrics = async (user) => {
  const cacheKey = user.role;
  const now = Date.now();
  const cached = dashboardCache.get(cacheKey);

  const ttlMs = (env.DASHBOARD_CACHE_TTL_SEC || 60) * 1000;
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const startOfToday = startOfDay(new Date());

  // Single aggregation query using $facet across invoices
  const [invoiceStats] = await Invoice.aggregate([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalInvoiced: { $sum: '$grandTotal' },
              totalOutstanding: { $sum: '$amountDue' },
            },
          },
        ],
        overdue: [
          {
            $match: {
              status: 'confirmed',
              amountDue: { $gt: 0 },
              dueDate: { $lt: startOfToday },
            },
          },
          {
            $group: {
              _id: null,
              overdueAmount: { $sum: '$amountDue' },
              overdueCount: { $sum: 1 },
            },
          },
        ],
        pending: [
          {
            $match: {
              status: 'confirmed',
              amountDue: { $gt: 0 },
              dueDate: { $gte: startOfToday },
            },
          },
          {
            $group: {
              _id: null,
              pendingCount: { $sum: 1 },
            },
          },
        ],
        statusBreakdown: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              amount: { $sum: '$grandTotal' },
            },
          },
        ],
      },
    },
  ]);

  // Payments total revenue (cash basis) & last 12 months trend
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11);
  twelveMonthsAgo.setUTCDate(1);
  twelveMonthsAgo.setUTCHours(0, 0, 0, 0);

  const [paymentStats] = await Payment.aggregate([
    { $match: { status: 'recorded' } },
    {
      $facet: {
        totalRevenue: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
        revenueByMonth: [
          { $match: { paidAt: { $gte: twelveMonthsAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$paidAt' },
                month: { $month: '$paidAt' },
              },
              revenue: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ],
      },
    },
  ]);

  // Subscription breakdown by status & total active
  const subscriptionBreakdown = await Subscription.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Counts & Recents
  const [totalCustomers, activeSubscriptions, recentPayments, recentSubscriptions] =
    await Promise.all([
      Customer.countDocuments({ isActive: true }),
      Subscription.countDocuments({ status: 'active' }),
      Payment.find({ status: 'recorded' })
        .sort({ paidAt: -1 })
        .limit(5)
        .populate('customerId', 'name')
        .populate('invoiceId', 'invoiceNumber')
        .lean(),
      Subscription.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name')
        .lean(),
    ]);

  const totals = invoiceStats?.totals?.[0] || { totalInvoiced: 0, totalOutstanding: 0 };
  const overdue = invoiceStats?.overdue?.[0] || { overdueAmount: 0, overdueCount: 0 };
  const pending = invoiceStats?.pending?.[0] || { pendingCount: 0 };
  const totalRevenue = paymentStats?.totalRevenue?.[0]?.total || 0;

  const data = {
    totalRevenue: roundMoney(totalRevenue),
    totalInvoiced: roundMoney(totals.totalInvoiced),
    totalOutstanding: roundMoney(totals.totalOutstanding),
    overdueAmount: roundMoney(overdue.overdueAmount),
    overdueCount: overdue.overdueCount,
    pendingCount: pending.pendingCount,
    activeSubscriptions,
    totalCustomers,
    recentPayments,
    recentSubscriptions,
    chartSeries: {
      revenueByMonth: paymentStats?.revenueByMonth || [],
      invoiceStatusBreakdown: invoiceStats?.statusBreakdown || [],
      subscriptionsByStatus: subscriptionBreakdown || [],
    },
  };

  // Staff view excludes sensitive staff details or internal cost data
  if (user.role === ROLES.STAFF) {
    delete data.internalMargins;
  }

  dashboardCache.set(cacheKey, { timestamp: now, data });
  return data;
};

module.exports = {
  getDashboardMetrics,
  invalidateDashboardCache,
};
