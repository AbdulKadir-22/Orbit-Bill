const express = require('express');
const router = express.Router();
const reportController = require('./report.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate, requirePermission(PERMISSIONS.REPORTS_VIEW));

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Financial reporting, MRR calculations, aging buckets, and CSV exports
 */

/**
 * @swagger
 * /api/v1/reports/revenue:
 *   get:
 *     summary: Cash-basis revenue collected by method and timeline
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Revenue report
 */
router.get('/revenue', reportController.getRevenueReport);

/**
 * @swagger
 * /api/v1/reports/invoices-summary:
 *   get:
 *     summary: Invoices summary (invoiced, collected, outstanding, and status counts)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoices summary
 */
router.get('/invoices-summary', reportController.getInvoicesSummaryReport);
router.get('/invoices/summary', reportController.getInvoicesSummaryReport);

/**
 * @swagger
 * /api/v1/reports/outstanding:
 *   get:
 *     summary: Outstanding unpaid and partial invoices with days overdue
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Outstanding invoices
 */
router.get('/outstanding', reportController.getOutstandingReport);

/**
 * @swagger
 * /api/v1/reports/overdue:
 *   get:
 *     summary: Overdue invoices with aging buckets (1-30, 31-60, 61-90, 90+ days)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aging buckets
 */
router.get('/overdue', reportController.getOverdueAgingReport);
router.get('/aging', reportController.getOverdueAgingReport);

/**
 * @swagger
 * /api/v1/reports/subscriptions:
 *   get:
 *     summary: Subscriptions metrics and normalized Monthly Recurring Revenue (MRR)
 *     description: "MRR formula: daily × 30, weekly × (52/12), monthly × 1, yearly ÷ 12."
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions & MRR report
 */
router.get('/subscriptions', reportController.getSubscriptionsReport);

/**
 * @swagger
 * /api/v1/reports/top-customers:
 *   get:
 *     summary: Top customers by revenue collected
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top customers
 */
router.get('/top-customers', reportController.getTopCustomersReport);

/**
 * @swagger
 * /api/v1/reports/export/{type}:
 *   get:
 *     summary: Stream CSV report export (revenue, outstanding, overdue)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [revenue, outstanding, overdue]
 *     responses:
 *       200:
 *         description: CSV stream
 */
router.get('/export/:type', reportController.exportReportCsv);

module.exports = router;
