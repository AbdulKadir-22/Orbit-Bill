const welcomeEmailTemplate = ({ name, email }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to OrbitBill</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #111827; }
    p { font-size: 15px; line-height: 1.6; color: #4b5563; }
    .footer { margin-top: 32px; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">OrbitBill</div>
    <div class="title">Welcome aboard, ${name}!</div>
    <p>Thank you for creating an account with OrbitBill. You can now access your customer portal to view and manage your subscriptions, quotations, and invoices anytime.</p>
    <p>Your registered email is: <strong>${email}</strong></p>
    <p>If you have any questions or need assistance, our support team is always here to help.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} OrbitBill Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

const resetPasswordEmailTemplate = ({ name, resetUrl, expiresInMinutes }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password - OrbitBill</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #111827; }
    p { font-size: 15px; line-height: 1.6; color: #4b5563; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; font-weight: 600; border-radius: 6px; margin: 20px 0; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; font-size: 13px; color: #92400e; margin-top: 20px; border-radius: 4px; }
    .footer { margin-top: 32px; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">OrbitBill</div>
    <div class="title">Password Reset Request</div>
    <p>Hello ${name || 'there'},</p>
    <p>We received a request to reset your OrbitBill account password. Click the button below to proceed:</p>
    <p>
      <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
    </p>
    <div class="alert">
      This password reset link will expire in <strong>${expiresInMinutes} minutes</strong>. If you did not request this reset, please ignore this email or contact security if you have concerns.
    </div>
    <p style="margin-top: 20px; font-size: 13px; word-break: break-all; color: #6b7280;">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      ${resetUrl}
    </p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} OrbitBill Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

const staffInviteEmailTemplate = ({ name, email, temporaryPassword, loginUrl }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OrbitBill Staff Account Created</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #111827; }
    p { font-size: 15px; line-height: 1.6; color: #4b5563; }
    .credentials { background: #f3f4f6; border-radius: 6px; padding: 16px; margin: 20px 0; font-family: monospace; font-size: 14px; color: #1f2937; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; font-weight: 600; border-radius: 6px; margin: 16px 0; }
    .footer { margin-top: 32px; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">OrbitBill</div>
    <div class="title">Welcome to the Team, ${name}!</div>
    <p>An administrator has created your staff account for the OrbitBill management platform.</p>
    <div class="credentials">
      <div><strong>Email:</strong> ${email}</div>
      ${temporaryPassword ? `<div style="margin-top: 8px;"><strong>Temporary Password:</strong> ${temporaryPassword}</div>` : ''}
    </div>
    <p>Please log in and update your password immediately upon your first sign-in.</p>
    <p>
      <a href="${loginUrl}" class="btn" target="_blank">Sign in to OrbitBill</a>
    </p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} OrbitBill Systems. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = {
  welcomeEmailTemplate,
  resetPasswordEmailTemplate,
  staffInviteEmailTemplate,
};
