const User = require('../modules/users/user.model');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokens');
const asyncHandler = require('../utils/asyncHandler');
const ROLES = require('../constants/roles');

/**
 * Verifies the JWT Bearer access token, retrieves user, and validates account status.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(ApiError.unauthorized('Authentication token is required'));
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired'));
    }
    return next(ApiError.unauthorized('Invalid authentication token'));
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return next(ApiError.unauthorized('User associated with this token no longer exists'));
  }

  if (!user.isActive) {
    return next(ApiError.forbidden('Your account has been deactivated. Please contact an administrator.'));
  }

  req.user = user;
  next();
});

module.exports = {
  authenticate,
};
