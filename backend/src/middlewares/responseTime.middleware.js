const logger = require('../config/logger');

/**
 * Middleware that calculates request processing duration, logs slow requests (>= 2000ms),
 * and exposes the X-Response-Time header on every response.
 */
const responseTimeMiddleware = (req, res, next) => {
  const start = process.hrtime();

  // Patch res.writeHead to set header before headers are sent
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs}ms`);
    }
    return originalWriteHead.apply(this, args);
  };

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    if (durationMs >= 2000) {
      logger.warn(
        `[SLOW REQUEST WARNING] ${req.method} ${req.originalUrl} took ${durationMs}ms (status: ${res.statusCode})`
      );
    }
  });

  next();
};

module.exports = responseTimeMiddleware;
