const nodemailer            = require('nodemailer');
const { generateBillPDF }   = require('./billReceipt.util');

/**
 * Builds a nodemailer transporter.
 */
const buildTransporter = (emailSettings = {}) => {
  const useVendorSmtp =
    emailSettings.provider === 'smtp' &&
    emailSettings.smtpHost &&
    emailSettings.smtpUser &&
    emailSettings.smtpPass;

  if (useVendorSmtp) {
    return nodemailer.createTransport({
      host:   emailSettings.smtpHost,
      port:   emailSettings.smtpPort  || 587,
      secure: emailSettings.smtpSecure || false,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPass,
      },
    });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(
      'Platform email is not configured. ' +
      'Set SMTP_HOST, SMTP_USER and SMTP_PASS in .env, ' +
      'or configure email settings for this restaurant.'
    );
  }

  // Platform-level SMTP (your system account, sends on behalf of vendor)
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * @param {Object} order      - Populated order document
 * @param {Object} restaurant - Restaurant document
 */
const sendBillEmail = async (order, restaurant) => {
  const toEmail = order.user?.email;
  if (!toEmail) throw new Error('Customer has no email address on file');

  const emailSettings = restaurant?.notificationSettings?.email   || {};
  const branding      = restaurant?.notificationSettings?.branding || {};

  const fromName    = emailSettings.fromName    || restaurant?.name || 'Restaurant';
  const fromAddress = emailSettings.fromAddress || process.env.SMTP_USER;

  const transporter = buildTransporter(emailSettings);
  const pdfBuffer   = await generateBillPDF(order, restaurant);

  const itemRows = order.items.map(item => {
    const qty = item.qty || item.quantity || 1;
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0">${qty}× ${item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">
          LKR ${((item.price || 0) * qty).toLocaleString()}
        </td>
      </tr>`;
  }).join('');

  await transporter.sendMail({
    from:    `"${fromName}" <${fromAddress}>`,
    to:      toEmail,
    subject: `Your Bill — Table ${order.tableId} | ${fromName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;color:#1e293b">
        ${branding.logoUrl
          ? `<img src="${branding.logoUrl}" alt="${fromName}" style="height:60px;display:block;margin:0 auto 16px">`
          : ''}
        <h2 style="text-align:center">${fromName}</h2>
        ${branding.address ? `<p style="text-align:center;color:#64748b;font-size:0.85em">${branding.address}</p>` : ''}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
        <p>Hi ${order.user?.name || 'Guest'}, here is your bill:</p>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:8px;text-align:left">Item</th>
              <th style="padding:8px;text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="font-weight:bold;font-size:1.1em">
              <td style="padding:12px">Total</td>
              <td style="padding:12px;text-align:right">
                LKR ${(order.totalPrice || 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#64748b;font-size:0.8em;margin-top:24px">
          Order #${String(order._id).slice(-6).toUpperCase()} • Table ${order.tableId}
          ${branding.taxNumber ? ` • VAT: ${branding.taxNumber}` : ''}
        </p>
        <p style="text-align:center;margin-top:24px;color:#64748b">
          ${branding.footerNote || 'Thank you for dining with us!'}
        </p>
      </div>`,
    attachments: [{
      filename:    `bill-${String(order._id).slice(-6)}.pdf`,
      content:     pdfBuffer,
      contentType: 'application/pdf',
    }],
  });
};

module.exports = { sendBillEmail };