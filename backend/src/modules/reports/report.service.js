const Payment = require('../payments/payment.model');
const Invoice = require('../invoices/invoice.model');
const Subscription = require('../subscriptions/subscription.model');
const Customer = require('../customers/customer.model');
const ApiError = require('../../utils/ApiError');
const { startOfDay, endOfDay } = require('../../utils/dates');
const { roundMoney } = require('../../utils/pricing');

const validateDateRange = (from, to) => {
  const now = new Date();
  const startDate = from ? startOfDay(new Date(from)) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const endDate = to ? endOfDay(new Date(to)) : endOfDay(now);

  if (startDate > endDate) {
    throw ApiError.badRequest('Invalid date range: "from" date must be earlier than or equal to "to" date', [
      { field: 'from', message: '"from" must be <= "to"' },
    ]);
  }

  // Max 2 years span
  const maxSpanMs = 2 * 365 * 24 * 60 * 60 * 1000;
  if (endDate.getTime() - startDate.getTime() > maxSpanMs) {
    throw ApiError.badRequest('Date range cannot exceed 2 years', [
      { field: 'range', message: 'Maximum allowed range span is 2 years' },
    ]);
  }

  return { startDate, endDate };
};

const getRevenueReport = async (query) => {
  const { startDate, endDate } = validateDateRange(query.from, query.to);

  const [methodBreakdown, timeline] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          status: 'recorded',
          paidAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: 'recorded',
          paidAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const totalRevenue = roundMoney(methodBreakdown.reduce((sum, m) => sum + m.total, 0));

  return {
    range: { from: startDate, to: endDate },
    totalRevenue,
    byMethod: methodBreakdown,
    timeline,
  };
};

const getInvoicesSummaryReport = async (query) => {
  const { startDate, endDate } = validateDateRange(query.from, query.to);

  const [stats] = await Invoice.aggregate([
    {
      $match: {
        invoiceDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              invoiced: { $sum: '$grandTotal' },
              collected: { $sum: '$amountPaid' },
              outstanding: { $sum: '$amountDue' },
              count: { $sum: 1 },
            },
          },
        ],
        byStatus: [
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

  const totals = stats?.totals?.[0] || { invoiced: 0, collected: 0, outstanding: 0, count: 0 };

  return {
    range: { from: startDate, to: endDate },
    totalInvoiced: roundMoney(totals.invoiced),
    totalCollected: roundMoney(totals.collected),
    totalOutstanding: roundMoney(totals.outstanding),
    invoiceCount: totals.count,
    byStatus: stats?.byStatus || [],
  };
};

const getOutstandingReport = async (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {
    status: 'confirmed',
    amountDue: { $gt: 0 },
  };

  const startOfToday = startOfDay(new Date());

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email company phone')
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  const list = invoices.map((inv) => {
    const daysOverdue = Math.max(0, Math.floor((startOfToday - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24)));
    return {
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customerId,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      grandTotal: inv.grandTotal,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      daysOverdue,
    };
  });

  return {
    invoices: list,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getOverdueAgingReport = async () => {
  const startOfToday = startOfDay(new Date());

  const overdueInvoices = await Invoice.find({
    status: 'confirmed',
    amountDue: { $gt: 0 },
    dueDate: { $lt: startOfToday },
  })
    .populate('customerId', 'name company email')
    .lean();

  const buckets = {
    '1_30': { label: '1 - 30 Days', count: 0, amount: 0, invoices: [] },
    '31_60': { label: '31 - 60 Days', count: 0, amount: 0, invoices: [] },
    '61_90': { label: '61 - 90 Days', count: 0, amount: 0, invoices: [] },
    '90_plus': { label: '90+ Days', count: 0, amount: 0, invoices: [] },
  };

  let totalOverdue = 0;

  overdueInvoices.forEach((inv) => {
    const daysOverdue = Math.floor((startOfToday - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
    totalOverdue = roundMoney(totalOverdue + inv.amountDue);

    let bucketKey = '90_plus';
    if (daysOverdue <= 30) bucketKey = '1_30';
    else if (daysOverdue <= 60) bucketKey = '31_60';
    else if (daysOverdue <= 90) bucketKey = '61_90';

    buckets[bucketKey].count++;
    buckets[bucketKey].amount = roundMoney(buckets[bucketKey].amount + inv.amountDue);
    buckets[bucketKey].invoices.push({
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customerId,
      amountDue: inv.amountDue,
      dueDate: inv.dueDate,
      daysOverdue,
    });
  });

  return {
    asOf: startOfToday,
    totalOverdueCount: overdueInvoices.length,
    totalOverdueAmount: roundMoney(totalOverdue),
    agingBuckets: buckets,
  };
};

/**
 * Normalizes Monthly Recurring Revenue (MRR):
 * - daily: recurring × 30
 * - weekly: recurring × (52 / 12)
 * - monthly: recurring × 1
 * - yearly: recurring ÷ 12
 */
const getSubscriptionsReport = async (query) => {
  const { startDate, endDate } = validateDateRange(query.from, query.to);

  const activeSubscriptions = await Subscription.find({ status: 'active' }).lean();

  let totalMRR = 0;
  const cycleBreakdown = { daily: 0, weekly: 0, monthly: 0, yearly: 0 };

  activeSubscriptions.forEach((sub) => {
    cycleBreakdown[sub.billingCycle] = (cycleBreakdown[sub.billingCycle] || 0) + 1;
    const base = sub.grandTotal || 0;

    let mrr = 0;
    if (sub.billingCycle === 'daily') mrr = base * 30;
    else if (sub.billingCycle === 'weekly') mrr = base * (52 / 12);
    else if (sub.billingCycle === 'monthly') mrr = base;
    else if (sub.billingCycle === 'yearly') mrr = base / 12;

    totalMRR = roundMoney(totalMRR + mrr);
  });

  const [newCount, closedCount] = await Promise.all([
    Subscription.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    Subscription.countDocuments({ closedAt: { $gte: startDate, $lte: endDate } }),
  ]);

  return {
    range: { from: startDate, to: endDate },
    activeCount: activeSubscriptions.length,
    totalMRR: roundMoney(totalMRR),
    newSubscriptionsInRange: newCount,
    closedSubscriptionsInRange: closedCount,
    cycleBreakdown,
  };
};

const getTopCustomersReport = async (query) => {
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));

  const top = await Payment.aggregate([
    { $match: { status: 'recorded' } },
    {
      $group: {
        _id: '$customerId',
        totalRevenue: { $sum: '$amount' },
        paymentCount: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerId: '$_id',
        name: '$customer.name',
        email: '$customer.email',
        company: '$customer.company',
        totalRevenue: { $round: ['$totalRevenue', 2] },
        paymentCount: 1,
      },
    },
  ]);

  return top;
};

/**
 * Escapes fields for CSV according to RFC 4180
 */
const escapeCsv = (str) => {
  if (str === null || str === undefined) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
};

const exportReportCsv = async (type, query, res) => {
  let filename = `${type}_report_${Date.now()}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  if (type === 'revenue') {
    const report = await getRevenueReport(query);
    res.write('Date,Payment Number,Method,Amount\n');
    report.timeline.forEach((row) => {
      res.write(`${escapeCsv(row._id)},${escapeCsv(row.count)},,${row.total}\n`);
    });
    res.end();
  } else if (type === 'outstanding') {
    const report = await getOutstandingReport({ limit: 1000 });
    res.write('Invoice Number,Customer Name,Customer Email,Invoice Date,Due Date,Days Overdue,Grand Total,Amount Due\n');
    report.invoices.forEach((inv) => {
      res.write(
        `${escapeCsv(inv.invoiceNumber)},${escapeCsv(inv.customer?.name)},${escapeCsv(
          inv.customer?.email
        )},${escapeCsv(inv.invoiceDate)},${escapeCsv(inv.dueDate)},${inv.daysOverdue},${inv.grandTotal},${inv.amountDue}\n`
      );
    });
    res.end();
  } else if (type === 'overdue') {
    const report = await getOverdueAgingReport();
    res.write('Bucket,Invoice Number,Customer Name,Customer Email,Days Overdue,Due Date,Amount Due\n');
    Object.values(report.agingBuckets).forEach((b) => {
      b.invoices.forEach((inv) => {
        res.write(
          `${escapeCsv(b.label)},${escapeCsv(inv.invoiceNumber)},${escapeCsv(inv.customer?.name)},${escapeCsv(
            inv.customer?.email
          )},${inv.daysOverdue},${escapeCsv(inv.dueDate)},${inv.amountDue}\n`
        );
      });
    });
    res.end();
  } else {
    throw ApiError.badRequest(`Unsupported export type: '${type}'`);
  }
};

module.exports = {
  getRevenueReport,
  getInvoicesSummaryReport,
  getOutstandingReport,
  getOverdueAgingReport,
  getSubscriptionsReport,
  getTopCustomersReport,
  exportReportCsv,
};
