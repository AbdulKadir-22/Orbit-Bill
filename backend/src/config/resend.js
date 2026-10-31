const { Resend } = require('resend');
const env = require('./env');
const logger = require('./logger');

let resendClient = null;

if (env.RESEND_API_KEY) {
  resendClient = new Resend(env.RESEND_API_KEY);
} else {
  logger.warn('RESEND_API_KEY is not configured. Outgoing emails will be logged only.');
}

module.exports = resendClient;
