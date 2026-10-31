const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const {
  createStaffValidation,
  updateStaffValidation,
  updateStaffStatusValidation,
  updateStaffPermissionsValidation,
  staffIdParamValidation,
  listStaffValidation,
} = require('./user.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/rbac.middleware');
const ROLES = require('../../constants/roles');

// Apply authentication and strict admin role requirement to all staff management routes
router.use(authenticate, authorizeRoles(ROLES.ADMIN));

/**
 * @swagger
 * tags:
 *   name: Staff
 *   description: Staff management endpoints (Admin only)
 */

/**
 * @swagger
 * /api/v1/staff:
 *   post:
 *     summary: Create a new staff account
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 example: staff@orbitbill.com
 *               password:
 *                 type: string
 *                 example: St@ffPass123
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["customers:read", "invoices:read", "payments:record"]
 *     responses:
 *       201:
 *         description: Staff user created successfully
 *       400:
 *         description: Validation error or weak password
 *       403:
 *         description: Forbidden (Non-admin user)
 *       409:
 *         description: Email already in use
 *   get:
 *     summary: List staff members with pagination and filters
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of staff members
 *       403:
 *         description: Forbidden
 */
router.route('/')
  .post(validate(createStaffValidation), userController.createStaff)
  .get(validate(listStaffValidation), userController.listStaff);

/**
 * @swagger
 * /api/v1/staff/{id}:
 *   get:
 *     summary: Get staff member details by ID
 *     tags: [Staff]
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
 *         description: Staff details
 *       404:
 *         description: Staff not found
 *   patch:
 *     summary: Update staff member name or permissions
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Staff member updated successfully
 *       404:
 *         description: Staff not found
 */
router.route('/:id')
  .get(validate(staffIdParamValidation), userController.getStaffById)
  .patch(validate(updateStaffValidation), userController.updateStaff)
  .delete(validate(staffIdParamValidation), userController.deleteStaff);

/**
 * @swagger
 * /api/v1/staff/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Cannot deactivate self
 *       404:
 *         description: Staff not found
 */
router.patch(
  '/:id/status',
  validate(updateStaffStatusValidation),
  userController.updateStaffStatus
);

/**
 * @swagger
 * /api/v1/staff/{id}/permissions:
 *   patch:
 *     summary: Update permissions for a staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *       404:
 *         description: Staff not found
 */
router.patch(
  '/:id/permissions',
  validate(updateStaffPermissionsValidation),
  userController.updateStaffPermissions
);

module.exports = router;
