const ROLES = require('../../constants/roles');
const ApiError = require('../../utils/ApiError');

/**
 * Valid states for subscriptions:
 * draft, quotation, confirmed, active, paused, closed
 */
const SUBSCRIPTION_STATUSES = Object.freeze({
  DRAFT: 'draft',
  QUOTATION: 'quotation',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed',
});

/**
 * Allowed transition mapping:
 * draft -> quotation, confirmed, closed
 * quotation -> confirmed, closed
 * confirmed -> active, closed
 * active -> paused, closed
 * paused -> active, closed
 * closed -> (terminal)
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  [SUBSCRIPTION_STATUSES.DRAFT]: [
    SUBSCRIPTION_STATUSES.QUOTATION,
    SUBSCRIPTION_STATUSES.CONFIRMED,
    SUBSCRIPTION_STATUSES.CLOSED,
  ],
  [SUBSCRIPTION_STATUSES.QUOTATION]: [
    SUBSCRIPTION_STATUSES.CONFIRMED,
    SUBSCRIPTION_STATUSES.CLOSED,
  ],
  [SUBSCRIPTION_STATUSES.CONFIRMED]: [
    SUBSCRIPTION_STATUSES.ACTIVE,
    SUBSCRIPTION_STATUSES.CLOSED,
  ],
  [SUBSCRIPTION_STATUSES.ACTIVE]: [
    SUBSCRIPTION_STATUSES.PAUSED,
    SUBSCRIPTION_STATUSES.CLOSED,
  ],
  [SUBSCRIPTION_STATUSES.PAUSED]: [
    SUBSCRIPTION_STATUSES.ACTIVE,
    SUBSCRIPTION_STATUSES.CLOSED,
  ],
  [SUBSCRIPTION_STATUSES.CLOSED]: [], // terminal
});

/**
 * Checks whether a status transition is allowed.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
const canTransition = (from, to) => {
  if (!from || !to) return false;
  if (from === to) return true; // idempotent
  const validNext = ALLOWED_TRANSITIONS[from] || [];
  return validNext.includes(to);
};

/**
 * Asserts that a status transition is allowed; otherwise throws an ApiError 409 Conflict.
 * @param {string} from
 * @param {string} to
 * @param {string} [contextMessage]
 */
const assertTransition = (from, to, contextMessage = '') => {
  if (!canTransition(from, to)) {
    const errorPrefix = contextMessage ? `${contextMessage}: ` : '';
    throw ApiError.conflict(
      `${errorPrefix}Invalid state transition from '${from}' to '${to}'. Allowed transitions from '${from}': [${(
        ALLOWED_TRANSITIONS[from] || []
      ).join(', ')}]`
    );
  }
};

module.exports = {
  SUBSCRIPTION_STATUSES,
  ALLOWED_TRANSITIONS,
  canTransition,
  assertTransition,
};
