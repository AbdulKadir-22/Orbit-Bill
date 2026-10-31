/**
 * Centralized User-facing copy for OrbitBill
 * Strict compliance: zero hardcoded UI strings in components.
 * Organized for multi-language readiness.
 */
export const STRINGS = {
  // Brand
  BRAND_NAME: 'OrbitBill',
  BRAND_TAGLINE_P1: 'Subscription management',
  BRAND_TAGLINE_P2: 'made simple',
  BRAND_SUBTITLE: 'Manage your products, subscriptions, invoices and revenue — all in one place.',
  BRAND_FOOTER: 'Trusted by growing businesses worldwide.',

  // Features list on BrandPanel
  FEATURES: {
    RECURRING_BILLING: 'Recurring billing',
    AUTOMATED_INVOICING: 'Automated invoicing',
    CUSTOMER_MANAGEMENT: 'Customer management',
    REALTIME_REPORTING: 'Real-time reporting',
  },

  // Language Selector
  LANG: {
    LABEL: 'Language',
    EN: 'English',
  },

  // Auth Tabs & Headings
  AUTH: {
    TAB_LOGIN: 'Login',
    TAB_REGISTER: 'Create Account',
    LOGIN_TITLE: 'Welcome back',
    LOGIN_SUBTITLE: 'Sign in to your OrbitBill account.',
    REGISTER_TITLE: 'Create your account',
    REGISTER_SUBTITLE: 'Get started with OrbitBill in seconds.',
    FORGOT_TITLE: 'Reset your password',
    FORGOT_SUBTITLE: 'Enter your email address and we will send you a reset link.',
    RESET_TITLE: 'Set new password',
    RESET_SUBTITLE: 'Choose a strong password with at least 9 characters.',

    // Fields & Labels
    FIELD_NAME: 'Full name',
    FIELD_NAME_PLACEHOLDER: 'Jane Doe',
    FIELD_EMAIL: 'Email address',
    FIELD_EMAIL_PLACEHOLDER: 'you@example.com',
    FIELD_PASSWORD: 'Password',
    FIELD_PASSWORD_PLACEHOLDER: 'Enter your password',
    FIELD_CONFIRM_PASSWORD: 'Confirm password',
    FIELD_CONFIRM_PASSWORD_PLACEHOLDER: 'Re-enter your password',
    FIELD_NEW_PASSWORD: 'New password',
    FIELD_NEW_PASSWORD_PLACEHOLDER: 'Enter new password',

    REMEMBER_ME: 'Remember me',
    FORGOT_PASSWORD_LINK: 'Forgot password?',
    BACK_TO_LOGIN: '← Back to sign in',
    HAVE_ACCOUNT: 'Already have an account? Sign in',
    NO_ACCOUNT: "Don't have an account? Create one",

    // Actions
    BTN_LOGIN: 'Sign in',
    BTN_REGISTER: 'Create account',
    BTN_SEND_RESET: 'Send reset link',
    BTN_RESET_PASSWORD: 'Reset password',
    BTN_SUBMITTING: 'Processing...',

    // Password Rules
    RULES_HEADING: 'Password requirements:',
    RULE_MIN_LENGTH: 'At least 9 characters long',
    RULE_UPPERCASE: 'At least one uppercase letter (A-Z)',
    RULE_LOWERCASE: 'At least one lowercase letter (a-z)',
    RULE_SPECIAL: 'At least one special character (!@#$%^&*)',

    // Feedback messages
    SUCCESS_RESET_SENT: 'If an account exists for this email, a reset link has been sent.',
    SUCCESS_PASSWORD_RESET: 'Password has been reset successfully. Please sign in.',
    ERROR_INVALID_CREDENTIALS: 'Invalid email or password.',
    ERROR_ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Please contact an administrator.',
    ERROR_PASSWORD_MISMATCH: 'Passwords do not match.',
    ERROR_DEFAULT: 'An unexpected error occurred. Please try again.',
  },

  // Session & Auth Notices
  SESSION_EXPIRED: 'Session expired, please sign in again.',

  // Topbar & User Menu
  USER_MENU: {
    ROLE_LABEL: 'Role',
    PROFILE: 'Profile',
    SIGN_OUT: 'Sign out',
  },

  // Navigation Items
  NAV: {
    DASHBOARD: 'Dashboard',
    PRODUCTS: 'Products',
    PLANS: 'Plans',
    CUSTOMERS: 'Customers',
    QUOTATIONS: 'Quotations',
    SUBSCRIPTIONS: 'Subscriptions',
    INVOICES: 'Invoices',
    PAYMENTS: 'Payments',
    TAXES: 'Taxes',
    DISCOUNTS: 'Discounts',
    STAFF: 'Staff',
    REPORTS: 'Reports',
    // Customer Portal
    MY_DASHBOARD: 'Dashboard',
    MY_SUBSCRIPTIONS: 'My Subscriptions',
    MY_INVOICES: 'My Invoices',
  },

  // Roles labels
  ROLES: {
    ADMIN: 'Admin',
    STAFF: 'Staff',
    CUSTOMER: 'Customer',
  },

  // Role Guard / Access Error
  NO_ACCESS: {
    TITLE: 'Access Denied',
    DESCRIPTION: "You don't have access to this page.",
    BACK_HOME: 'Return to Dashboard',
  },

  // 404 Not Found
  NOT_FOUND: {
    TITLE: 'Page Not Found',
    DESCRIPTION: "The page you are looking for doesn't exist or has been moved.",
    BACK_HOME: 'Go to Dashboard',
  },

  // Generic Placeholders
  PLACEHOLDER: {
    TITLE_SUFFIX: 'Management',
    BADGE: 'Under Development',
    HEADING: 'Coming in a later phase',
    DESCRIPTION: 'This module is scheduled for implementation in upcoming sprints.',
    BACK_TO_DASHBOARD: 'Back to Dashboard',
  },

  // UI Primitives
  UI: {
    EMPTY_DEFAULT_TITLE: 'No items found',
    EMPTY_DEFAULT_DESC: 'No records are available at this time.',
    CONFIRM_DEFAULT_TITLE: 'Are you sure?',
    CONFIRM_DEFAULT_DESC: 'This action cannot be undone.',
    CONFIRM_OK: 'Confirm',
    CONFIRM_CANCEL: 'Cancel',
    PAGINATION_PREV: 'Previous',
    PAGINATION_NEXT: 'Next',
    PAGINATION_PAGE: 'Page',
    PAGINATION_OF: 'of',
    LOADING: 'Loading...',
    SHOW_PASSWORD: 'Show password',
    HIDE_PASSWORD: 'Hide password',
    CLOSE: 'Close',
  },
};
