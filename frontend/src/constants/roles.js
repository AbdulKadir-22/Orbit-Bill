/**
 * System roles and permission helpers
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  STAFF: 'staff',
  CUSTOMER: 'customer',
});

/**
 * Returns default dashboard route for role
 * @param {string} role 
 * @returns {string}
 */
export const getRoleHomePath = (role) => {
  if (role === ROLES.CUSTOMER) {
    return '/my/dashboard';
  }
  return '/dashboard';
};

/**
 * Helper to check role hierarchy or inclusion
 * @param {string} userRole 
 * @param {string[]} allowedRoles 
 * @returns {boolean}
 */
export const isRoleAllowed = (userRole, allowedRoles = []) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};
