/**
 * Centralized UI strings, labels, placeholders, errors and notifications.
 * Strict compliance: zero hardcoded UI strings in components.
 */
export const STRINGS = {
  // Brand & Header
  APP_TITLE: "FLUX // USERS",
  APP_SUBTITLE: "SYSTEM DIRECTORY & ACCESS CONTROL",
  APP_VERSION: "v1.0.0-PROD",

  // Theme Controls
  THEME_TOGGLE_LIGHT: "LIGHT",
  THEME_TOGGLE_DARK: "DARK",
  THEME_TOOLTIP: "TOGGLE MONOCHROME THEME",

  // Action Buttons
  BTN_ADD_USER: "+ NEW USER",
  BTN_CANCEL: "CANCEL",
  BTN_CREATE: "CREATE RECORD",
  BTN_UPDATE: "SAVE CHANGES",
  BTN_EDIT: "EDIT",
  BTN_DELETE: "DELETE",
  BTN_CONFIRM_DELETE: "CONFIRM PURGE",
  BTN_REFRESH: "SYNC",
  BTN_SEARCH_CLEAR: "CLEAR",

  // Section Headers
  USERS_DIRECTORY_TITLE: "USER DIRECTORY",
  USERS_DIRECTORY_COUNT: (count) => `[${count} RECORDS]`,
  FORM_CREATE_TITLE: "REGISTER NEW IDENTITY",
  FORM_EDIT_TITLE: "MODIFY USER PROFILE",

  // Form Fields & Labels
  FIELD_NAME_LABEL: "FULL NAME",
  FIELD_NAME_PLACEHOLDER: "e.g. Alex Mercer",
  FIELD_NAME_HINT: "2 to 50 characters",

  FIELD_EMAIL_LABEL: "EMAIL IDENTIFIER",
  FIELD_EMAIL_PLACEHOLDER: "e.g. alex.mercer@flux.internal",
  FIELD_EMAIL_HINT: "Valid RFC 5322 email syntax",

  FIELD_AGE_LABEL: "AGE",
  FIELD_AGE_PLACEHOLDER: "e.g. 28",
  FIELD_AGE_HINT: "Number between 0 and 120 (optional)",

  // Search & Filter
  SEARCH_PLACEHOLDER: "SEARCH BY NAME OR EMAIL...",
  SEARCH_RESULTS_COUNT: (found, total) => `SHOWING ${found} OF ${total} USERS`,

  // Empty & Loading States
  LOADING_USERS: "FETCHING DIRECTORY DATA...",
  SUBMITTING_FORM: "COMMITTING TO DATABASE...",
  EMPTY_TITLE: "NO USERS IN SYSTEM",
  EMPTY_DESCRIPTION: "Database is currently empty. Initialize a new user profile above.",
  SEARCH_EMPTY_TITLE: "NO MATCHING RECORDS",
  SEARCH_EMPTY_DESCRIPTION: "No user identities matched your query.",

  // Badges & Labels
  USER_ID_LABEL: "ID",
  USER_CREATED_LABEL: "JOINED",
  USER_STATUS_ACTIVE: "ACTIVE",

  // Dialog & Modal Confirmations
  DELETE_MODAL_TITLE: "PURGE RECORD CONFIRMATION",
  DELETE_MODAL_WARNING: "WARNING: This operation is irreversible and will permanently delete user record:",
  DELETE_MODAL_PROMPT: "Are you certain you wish to proceed?",

  // Toast / Status Feedback Messages
  MSG_USER_CREATED_SUCCESS: "User created successfully.",
  MSG_USER_UPDATED_SUCCESS: "User updated successfully.",
  MSG_USER_DELETED_SUCCESS: "User deleted from system.",
  MSG_FETCH_ERROR: "Failed to fetch user directory. Ensure Express backend is running.",
  MSG_VALIDATION_ERROR: "Please correct the highlighted errors before submitting.",
  MSG_NETWORK_ERROR: "Network error: unable to establish connection with server.",

  // Validation Errors
  VALIDATION: {
    NAME_REQUIRED: "Name is required.",
    NAME_LENGTH: "Name must be between 2 and 50 characters.",
    EMAIL_REQUIRED: "Email address is required.",
    EMAIL_INVALID: "Please provide a valid email format.",
    AGE_INVALID: "Age must be an integer between 0 and 120.",
  },

  // Footer & Status
  STATUS_SERVER_ONLINE: "STATUS: CONNECTED",
  STATUS_SERVER_OFFLINE: "STATUS: DISCONNECTED",
  FOOTER_COPYRIGHT: "FLUX MONOCHROME ENGINE // ZERO DEPENDENCY BLOAT",
};
