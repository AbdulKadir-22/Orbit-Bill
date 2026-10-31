const ApiError = require('../utils/ApiError');
const ROLES = require('../constants/roles');

/**
 * Gatekeeper checking if the authenticated user has one of the allowed roles.
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to access this resource')
      );
    }

    next();
  };
};

/**
 * Checks if the user has the required permission:
 * - Admin always passes.
 * - Staff must have all specified permissions in their user.permissions array.
 * - Customer is always denied.
 */
const requirePermission = (...requiredPerms) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Admin has full system control
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Staff must hold all specified permissions
    if (req.user.role === ROLES.STAFF) {
      const userPermissions = req.user.permissions || [];
      const hasAll = requiredPerms.every((perm) => userPermissions.includes(perm));

      if (hasAll) {
        return next();
      }

      return next(
        ApiError.forbidden(
          `Missing required permission(s): ${requiredPerms.join(', ')}`
        )
      );
    }

    // Customer or any other role denied by default
    return next(ApiError.forbidden('Access denied for this role'));
  };
};

/**
 * Stub helper for Phases 3 & 4:
 * Ensures customers can only access resources belonging to their own customerId.
 * Admin and authorized staff bypass this check.
 *
 * @param {string} resourceCustomerField - Field name on req or req.params representing customerId
 */
const ownResource = (resourceCustomerField = 'customerId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Admin passes
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Staff passes (they are authorized at route level via requirePermission)
    if (req.user.role === ROLES.STAFF) {
      return next();
    }

    // Customer must match their customerId
    if (req.user.role === ROLES.CUSTOMER) {
      const targetCustomerId = req.params[resourceCustomerField] || req.body[resourceCustomerField] || req.query[resourceCustomerField];
      if (!req.user.customerId || (targetCustomerId && req.user.customerId.toString() !== targetCustomerId.toString())) {
        return next(ApiError.forbidden('You can only access your own customer resources'));
      }
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
  requirePermission,
  ownResource,
};
