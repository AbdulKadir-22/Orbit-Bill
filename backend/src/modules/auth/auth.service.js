const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const ROLES = require('../../constants/roles');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateCryptoToken,
} = require('../../utils/tokens');
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../../emails/email.service');
const env = require('../../config/env');

/**
 * Creates authentication token pair and securely stores hashed refresh token on user.
 */
const generateAuthTokens = async (user) => {
  const tokenPayload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store only the SHA-256 hash of the refresh token
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
};

/**
 * Public customer self-registration.
 * Any role sent in body is completely ignored and hardcoded to CUSTOMER.
 */
const register = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict('Email is already registered', [
      { field: 'email', message: 'Email is already in use' },
    ]);
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: ROLES.CUSTOMER,
    isActive: true,
  });

  const { accessToken, refreshToken } = await generateAuthTokens(user);

  // Send welcome email asynchronously without blocking registration
  sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {});

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Logs in a user, validates status, updates lastLoginAt, returns tokens.
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Explicitly select password
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.');
  }

  user.lastLoginAt = new Date();
  const { accessToken, refreshToken } = await generateAuthTokens(user);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Rotates refresh token, rejects reuse.
 */
const refreshTokens = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshTokenHash');
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated');
  }

  const incomingHash = hashToken(incomingRefreshToken);
  if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
    // Possible token reuse attempt: invalidate token immediately
    user.refreshTokenHash = null;
    await user.save();
    throw ApiError.unauthorized('Refresh token reuse detected or session expired. Please log in again.');
  }

  // Issue new tokens (rotation)
  const tokens = await generateAuthTokens(user);
  return tokens;
};

/**
 * Clears user's refresh token hash from database.
 */
const logout = async (userId) => {
  if (!userId) return;
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
};

/**
 * Forgot password handler:
 * Generates crypto-random token, stores SHA-256 hash with expiry, emails the link.
 * Note: Caller should always return a generic success message to prevent user enumeration.
 */
const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return false; // User not found, handled silently
  }

  if (!user.isActive) {
    return false;
  }

  const rawResetToken = generateCryptoToken(32);
  const hashedToken = hashToken(rawResetToken);
  const expiresAt = new Date(Date.now() + env.RESET_PASSWORD_EXPIRES_MIN * 60 * 1000);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = expiresAt;
  await user.save();

  await sendPasswordResetEmail({
    name: user.name,
    email: user.email,
    resetToken: rawResetToken,
  });

  return true;
};

/**
 * Validates reset token and expiry, applies new password, clears reset token & refresh sessions.
 */
const resetPassword = async ({ token, password }) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired password reset token');
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.refreshTokenHash = null; // Invalidate all existing refresh sessions
  await user.save();

  return true;
};

/**
 * Changes password when user is logged in. Requires current password verification.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isCurrentValid = await user.comparePassword(currentPassword);
  if (!isCurrentValid) {
    throw ApiError.badRequest('Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password does not match' },
    ]);
  }

  user.password = newPassword;
  user.refreshTokenHash = null; // Invalidate previous sessions
  await user.save();

  return true;
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
};
