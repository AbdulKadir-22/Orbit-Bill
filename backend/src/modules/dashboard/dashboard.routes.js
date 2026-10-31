const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/rbac.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Real-time high performance analytics and KPIs
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Retrieve dashboard KPIs, cash-basis revenue, active subscriptions and charts
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics and charts
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.DASHBOARD_VIEW),
  dashboardController.getDashboard
);

module.exports = router;
