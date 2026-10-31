import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { BrandPanel } from './components/BrandPanel';
import { LanguageSelector } from './components/LanguageSelector';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { Tabs } from '../../components/ui/Tabs';
import { LogoMark } from '../../components/layout/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { STRINGS } from '../../constants/strings';
import { getRoleHomePath } from '../../constants/roles';
import { authService } from './services/authService';

/**
 * Single-route Authentication screen (/auth)
 * Manages 4 states without extra routes:
 * 1. Login tab
 * 2. Create Account tab
 * 3. Forgot Password
 * 4. Reset Password (?token=...)
 */
export const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const resetToken = searchParams.get('token');

  const { login, register, isAuthenticated, role } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [isForgotState, setIsForgotState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to intended target or role home
  useEffect(() => {
    if (isAuthenticated && role) {
      const from = location.state?.from?.pathname || getRoleHomePath(role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, role, navigate, location.state]);

  /**
   * Helper to parse and map backend API errors
   */
  const handleApiError = (err, setFieldError) => {
    const status = err.response?.status;
    const data = err.response?.data;

    // 409 Duplicate email
    if (status === 409) {
      if (setFieldError) {
        setFieldError((prev) => ({
          ...prev,
          email: 'An account with this email already exists.',
        }));
      }
      return;
    }

    // 401 on login
    if (status === 401) {
      toast.error(STRINGS.AUTH.ERROR_INVALID_CREDENTIALS);
      if (setFieldError) {
        setFieldError((prev) => ({
          ...prev,
          password: STRINGS.AUTH.ERROR_INVALID_CREDENTIALS,
        }));
      }
      return;
    }

    // 403 Deactivated account
    if (status === 403) {
      toast.error(STRINGS.AUTH.ERROR_ACCOUNT_DEACTIVATED);
      return;
    }

    // 400 or 422 with field errors
    if ((status === 400 || status === 422) && data?.errors && Array.isArray(data.errors)) {
      const fieldMap = {};
      data.errors.forEach((e) => {
        if (e.field) {
          fieldMap[e.field] = e.message;
        }
      });
      if (Object.keys(fieldMap).length > 0 && setFieldError) {
        setFieldError((prev) => ({ ...prev, ...fieldMap }));
        return;
      }
    }

    // Fallback message
    const message = data?.message || err.message || STRINGS.AUTH.ERROR_DEFAULT;
    toast.error(message);
  };

  /**
   * Login handler
   */
  const handleLogin = async ({ email, password, rememberMe }, setFieldError) => {
    setIsSubmitting(true);
    try {
      const user = await login({ email, password, rememberMe });
      const destination = location.state?.from?.pathname || getRoleHomePath(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      handleApiError(err, setFieldError);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Register handler
   */
  const handleRegister = async ({ name, email, password }, setFieldError) => {
    setIsSubmitting(true);
    try {
      const user = await register({ name, email, password });
      const destination = getRoleHomePath(user.role);
      navigate(destination, { replace: true });
    } catch (err) {
      handleApiError(err, setFieldError);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Forgot password request
   */
  const handleSendReset = async ({ email }) => {
    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      return true;
    } catch {
      // Regardless of failure / user enumeration prevention, show success feedback
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset password submission
   */
  const handleResetPassword = async ({ token, password }, setFieldError) => {
    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, password });
      toast.success(STRINGS.AUTH.SUCCESS_PASSWORD_RESET);
      // Clear token from search params and switch to login
      setSearchParams({});
      setIsForgotState(false);
      setActiveTab('login');
    } catch (err) {
      handleApiError(err, setFieldError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine current form state
  const isResetState = !!resetToken;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f6f5f2] selection:bg-black selection:text-white">
      {/* Left Brand Panel (Desktop only) */}
      <div className="hidden lg:block lg:w-1/2 xl:w-5/12 h-screen sticky top-0">
        <BrandPanel />
      </div>

      {/* Right Interaction Panel */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 lg:p-12 min-h-screen">
        {/* Top bar with language selector and compact mobile logo */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-6">
          <div className="lg:hidden flex items-center gap-2 text-neutral-900">
            <LogoMark className="w-7 h-7 text-neutral-900" />
            <span className="font-bold text-base tracking-tight">
              {STRINGS.BRAND_NAME}
            </span>
          </div>
          <div className="ml-auto">
            <LanguageSelector />
          </div>
        </div>

        {/* Centered Auth Card */}
        <div className="w-full max-w-md mx-auto my-auto">
          <div className="bg-white rounded-[16px] border border-black/[0.08] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-6 sm:p-8">
            {/* If Reset Password State */}
            {isResetState ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                    {STRINGS.AUTH.RESET_TITLE}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                    {STRINGS.AUTH.RESET_SUBTITLE}
                  </p>
                </div>
                <ResetPasswordForm
                  token={resetToken}
                  onResetPassword={handleResetPassword}
                  isSubmitting={isSubmitting}
                />
              </div>
            ) : isForgotState ? (
              /* If Forgot Password State */
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                    {STRINGS.AUTH.FORGOT_TITLE}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                    {STRINGS.AUTH.FORGOT_SUBTITLE}
                  </p>
                </div>
                <ForgotPasswordForm
                  onSendReset={handleSendReset}
                  onBackToLogin={() => setIsForgotState(false)}
                  isSubmitting={isSubmitting}
                />
              </div>
            ) : (
              /* Standard Login / Create Account Tabs State */
              <div className="space-y-6">
                {/* Tabs */}
                <Tabs
                  tabs={[
                    { id: 'login', label: STRINGS.AUTH.TAB_LOGIN },
                    { id: 'register', label: STRINGS.AUTH.TAB_REGISTER },
                  ]}
                  activeTab={activeTab}
                  onChange={(tabId) => setActiveTab(tabId)}
                />

                {/* Form Title & Subtitle */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
                    {activeTab === 'login'
                      ? STRINGS.AUTH.LOGIN_TITLE
                      : STRINGS.AUTH.REGISTER_TITLE}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                    {activeTab === 'login'
                      ? STRINGS.AUTH.LOGIN_SUBTITLE
                      : STRINGS.AUTH.REGISTER_SUBTITLE}
                  </p>
                </div>

                {/* Active Form */}
                {activeTab === 'login' ? (
                  <LoginForm
                    onLogin={handleLogin}
                    onForgotPassword={() => setIsForgotState(true)}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <RegisterForm
                    onRegister={handleRegister}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom space for alignment */}
        <div className="w-full max-w-md mx-auto text-center py-4">
          <p className="text-[11px] text-neutral-400">
            © {new Date().getFullYear()} OrbitBill Systems. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
