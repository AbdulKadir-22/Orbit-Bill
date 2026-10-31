const Counter = require('../modules/counters/counter.model');

/**
 * Atomically increments sequence for a given model/scope and returns formatted reference ID.
 * Example formats:
 * - SUB-2026-00001
 * - QT-2026-00001
 * - INV-2026-00001
 * - PAY-2026-00001
 *
 * @param {string} counterKey - Key name for the counter (e.g. 'subscriptions_2026')
 * @param {string} prefix - Reference prefix (e.g. 'SUB', 'QT', 'INV', 'PAY')
 * @param {Object} options - Options including mongoose session and custom padding
 */
const generateSequenceNumber = async (counterKey, prefix, options = {}) => {
  const { session = null, padLength = 5, includeYear = true } = options;
  const currentYear = new Date().getFullYear();
  const fullKey = includeYear ? `${counterKey}_${currentYear}` : counterKey;

  const queryOptions = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  };

  if (session) {
    queryOptions.session = session;
  }

  const counter = await Counter.findOneAndUpdate(
    { name: fullKey },
    { $inc: { seq: 1 } },
    queryOptions
  );

  const formattedSeq = String(counter.seq).padStart(padLength, '0');
  return includeYear ? `${prefix}-${currentYear}-${formattedSeq}` : `${prefix}-${formattedSeq}`;
};

module.exports = {
  generateSequenceNumber,
};
