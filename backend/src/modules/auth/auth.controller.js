const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const authService = require('./auth.service');
const env = require('../../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.register({ name, email, password });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions());

  return ApiResponse.created(res, 'User registered successfully', {
    user,
    accessToken,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ email, password });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions());

  return ApiResponse.success(res, 'Login successful', {
    user,
    accessToken,
  });
});

const refresh = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const { accessToken, refreshToken } = await authService.refreshTokens(incomingRefreshToken);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions());

  return ApiResponse.success(res, 'Token refreshed successfully', {
    accessToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

  if (req.user) {
    await authService.logout(req.user._id);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions());

  return ApiResponse.success(res, 'Logged out successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  return ApiResponse.success(
    res,
    'If an account with that email exists, a password reset link has been sent.'
  );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword({ token, password });

  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions());

  return ApiResponse.success(res, 'Password has been reset successfully. Please log in with your new password.');
});

const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, 'Current user profile retrieved', {
    user: req.user,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, { currentPassword, newPassword });

  res.clearCookie(REFRESH_COOKIE_NAME, getCookieOptions());

  return ApiResponse.success(res, 'Password changed successfully. Please log in again.');
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
};
