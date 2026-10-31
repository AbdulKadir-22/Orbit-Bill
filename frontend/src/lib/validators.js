/**
 * Client-side validation helpers matching OrbitBill backend requirements:
 * - Email: valid format
 * - Password: min 9 chars, >=1 uppercase, >=1 lowercase, >=1 special character
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_RULES = [
  {
    id: 'length',
    labelKey: 'RULE_MIN_LENGTH',
    test: (val) => typeof val === 'string' && val.length >= 9,
  },
  {
    id: 'uppercase',
    labelKey: 'RULE_UPPERCASE',
    test: (val) => /[A-Z]/.test(val || ''),
  },
  {
    id: 'lowercase',
    labelKey: 'RULE_LOWERCASE',
    test: (val) => /[a-z]/.test(val || ''),
  },
  {
    id: 'special',
    labelKey: 'RULE_SPECIAL',
    test: (val) => /[^A-Za-z0-9]/.test(val || ''),
  },
];

/**
 * Checks email validity
 * @param {string} email 
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Checks if all password rules are satisfied
 * @param {string} password 
 * @returns {boolean}
 */
export const isStrongPassword = (password) => {
  return PASSWORD_RULES.every((rule) => rule.test(password));
};

/**
 * Returns evaluation array for live rule indicators
 * @param {string} password 
 * @returns {Array<{ id: string, labelKey: string, met: boolean }>}
 */
export const evaluatePasswordRules = (password) => {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    labelKey: rule.labelKey,
    met: rule.test(password),
  }));
};
