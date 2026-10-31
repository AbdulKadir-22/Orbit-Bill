const express = require('express');
const router = express.Router();
const planController = require('./plan.controller');
const {
  createPlanValidation,
  updatePlanValidation,
  updatePlanStatusValidation,
  listPlansValidation,
  planIdParamValidation,
} = require('./plan.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles, requirePermission } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Recurring subscription plan management
 */

/**
 * @swagger
 * /api/v1/plans:
 *   post:
 *     summary: Create a subscription plan (Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, billingCycle, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Monthly Enterprise
 *               billingCycle:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *                 example: monthly
 *               price:
 *                 type: number
 *                 example: 499
 *               minQuantity:
 *                 type: integer
 *                 default: 1
 *               availableFrom:
 *                 type: string
 *                 format: date-time
 *               availableTo:
 *                 type: string
 *                 format: date-time
 *               autoClose:
 *                 type: boolean
 *               allowEarlyClose:
 *                 type: boolean
 *               allowPause:
 *                 type: boolean
 *               allowRenewal:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Plan created successfully
 *       400:
 *         description: Validation error (e.g. availableTo <= availableFrom)
 *   get:
 *     summary: List subscription plans with filters (Admin and Staff with plans:view)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: billingCycle
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter plans currently within validity window
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated plans
 */
router.route('/')
  .post(
    authorizeRoles(ROLES.ADMIN),
    validate(createPlanValidation),
    planController.createPlan
  )
  .get(
    requirePermission(PERMISSIONS.PLANS_VIEW),
    validate(listPlansValidation),
    planController.listPlans
  );

/**
 * @swagger
 * /api/v1/plans/{id}:
 *   get:
 *     summary: Get plan details by ID
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan details
 *   patch:
 *     summary: Update plan fields (Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan updated
 *   delete:
 *     summary: Delete plan (Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan deleted
 */
router.route('/:id')
  .get(
    requirePermission(PERMISSIONS.PLANS_VIEW),
    validate(planIdParamValidation),
    planController.getPlanById
  )
  .patch(
    authorizeRoles(ROLES.ADMIN),
    validate(updatePlanValidation),
    planController.updatePlan
  )
  .delete(
    authorizeRoles(ROLES.ADMIN),
    validate(planIdParamValidation),
    planController.deletePlan
  );

/**
 * @swagger
 * /api/v1/plans/{id}/status:
 *   patch:
 *     summary: Activate/deactivate plan (Admin only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.ADMIN),
  validate(updatePlanStatusValidation),
  planController.updatePlanStatus
);

module.exports = router;
