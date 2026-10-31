const resend = require('../config/resend');
const env = require('../config/env');
const logger = require('../config/logger');
const {
  welcomeEmailTemplate,
  resetPasswordEmailTemplate,
  staffInviteEmailTemplate,
} = require('./templates');
const { quotationSentTemplate } = require('./templates/quotation-sent');

/**
 * Sends an email via Resend SDK or logs it if in dev / key is missing.
 * Failures are caught and logged so callers are never crashed.
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!resend) {
      logger.info(`[Email Service - Simulated] To: ${to} | Subject: "${subject}"`);
      return { success: true, simulated: true };
    }

    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error(`Resend API error sending email to ${to}: ${error.message || JSON.stringify(error)}`);
      return { success: false, error };
    }

    logger.info(`Email sent successfully to ${to} (Message ID: ${data?.id})`);
    return { success: true, data };
  } catch (err) {
    logger.error(`Exception while sending email to ${to}: ${err.message}`);
    return { success: false, error: err };
  }
};

const sendWelcomeEmail = async ({ name, email }) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to OrbitBill!',
    html: welcomeEmailTemplate({ name, email }),
  });
};

const sendPasswordResetEmail = async ({ name, email, resetToken }) => {
  const resetUrl = `${env.RESET_PASSWORD_URL}?token=${resetToken}`;
  return sendEmail({
    to: email,
    subject: 'OrbitBill Password Reset Request',
    html: resetPasswordEmailTemplate({
      name,
      resetUrl,
      expiresInMinutes: env.RESET_PASSWORD_EXPIRES_MIN,
    }),
  });
};

const sendStaffInviteEmail = async ({ name, email, temporaryPassword }) => {
  const loginUrl = `${env.CLIENT_URL}/login`;
  return sendEmail({
    to: email,
    subject: 'Your OrbitBill Staff Account has been created',
    html: staffInviteEmailTemplate({
      name,
      email,
      temporaryPassword,
      loginUrl,
    }),
  });
};

const sendQuotationEmail = async ({ quoteNumber, customerName, customerEmail, validUntil, grandTotal, lines }) => {
  return sendEmail({
    to: customerEmail,
    subject: `Quotation ${quoteNumber} from OrbitBill`,
    html: quotationSentTemplate({
      quoteNumber,
      customerName,
      validUntil,
      grandTotal,
      lines,
    }),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendStaffInviteEmail,
  sendQuotationEmail,
};
