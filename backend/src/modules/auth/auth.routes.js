const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require('./auth.validation');
const validate = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authRateLimiter } = require('../../middlewares/rateLimit.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and session management
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Auth]
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
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: customer@example.com
 *               password:
 *                 type: string
 *                 example: P@ssword123
 *     responses:
 *       201:
 *         description: Customer successfully registered
 *       400:
 *         description: Validation failed (weak password, invalid email format)
 *       409:
 *         description: Email already in use
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerValidation),
  authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: customer@example.com
 *               password:
 *                 type: string
 *                 example: P@ssword123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is deactivated
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginValidation),
  authController.login
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Rotate refresh token and get a new access token
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or reuse of refresh token
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset link dispatched if account exists
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordValidation),
  authController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 example: NewP@ssword123
 *     responses:
 *       200:
 *         description: Password successfully updated
 *       400:
 *         description: Invalid/expired token or weak password
 */
router.post(
  '/reset-password',
  validate(resetPasswordValidation),
  authController.resetPassword
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Retrieve currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   patch:
 *     summary: Change password for authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Current password mismatch or invalid new password
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordValidation),
  authController.changePassword
);

module.exports = router;
