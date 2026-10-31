const mongoose = require('mongoose');

const jobLockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lockedAt: {
      type: Date,
      default: Date.now,
    },
    lockedBy: {
      type: String,
      default: 'system',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

jobLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Attempts to acquire an atomic distributed lock in MongoDB.
 * @param {string} name - Lock identifier
 * @param {number} [ttlMs=300000] - Time to live in ms (default 5 minutes)
 * @param {string} [lockedBy='system'] - Process / host ID
 * @returns {Promise<boolean>} - True if acquired, false if already locked
 */
jobLockSchema.statics.acquireLock = async function (name, ttlMs = 300000, lockedBy = 'system') {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  try {
    const result = await this.findOneAndUpdate(
      {
        name,
        $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }],
      },
      {
        $set: {
          name,
          lockedAt: now,
          lockedBy,
          expiresAt,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    return Boolean(result);
  } catch (err) {
    if (err.code === 11000) {
      return false; // Active lock held by another process
    }
    throw err;
  }
};

/**
 * Releases the distributed lock.
 * @param {string} name
 * @returns {Promise<void>}
 */
jobLockSchema.statics.releaseLock = async function (name) {
  await this.deleteOne({ name });
};

module.exports = mongoose.model('JobLock', jobLockSchema);
