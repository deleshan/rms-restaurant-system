const twilio = require('twilio');

/**
 * Builds a Twilio client.
 * - Vendor-level: uses their own Twilio sub-account.
 * - Platform-level: uses system Twilio credentials.
 */
const buildTwilioClient = (waSettings = {}) => {
  const useVendorTwilio =
    waSettings.provider  === 'twilio' &&
    waSettings.accountSid &&
    waSettings.authToken;

  if (useVendorTwilio) {
    return {
      client: twilio(waSettings.accountSid, waSettings.authToken),
      from:   waSettings.fromNumber,
    };
  }

  return {
    client: twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN),
    from:   process.env.TWILIO_WHATSAPP_FROM, // e.g. whatsapp:+14155238886
  };
};

/**
 * Normalises a Sri Lankan phone number to E.164 (WhatsApp format).
 * Handles: 0771234567 → +94771234567
 *          94771234567 → +94771234567
 *          771234567   → +94771234567
 */
const toE164LK = (raw = '') => {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('94') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('0')  && digits.length === 10) return `+94${digits.slice(1)}`;
  if (digits.length === 9)                              return `+94${digits}`;
  return `+${digits}`; // best-effort fallback
};

/**
 * @param {Object} order      - Populated order document
 * @param {Object} restaurant - Restaurant document
 */
const sendBillWhatsApp = async (order, restaurant) => {
  const rawPhone = order.user?.phone;
  if (!rawPhone) throw new Error('Customer has no phone number on file');

  const waSettings = restaurant?.notificationSettings?.whatsapp || {};
  const branding   = restaurant?.notificationSettings?.branding  || {};
  const vendorName = restaurant?.name || 'Restaurant';

  const { client, from } = buildTwilioClient(waSettings);

  if (!from) throw new Error(`WhatsApp sender not configured for ${vendorName}`);

  const toNumber = `whatsapp:${toE164LK(rawPhone)}`;

  const itemLines = order.items.map(item => {
    const qty = item.qty || item.quantity || 1;
    return `  • ${qty}× ${item.name} — LKR ${(qty * (item.price || 0)).toLocaleString()}`;
  }).join('\n');

  const message = [
    `🧾 *Bill from ${vendorName}*`,
    branding.address ? `📍 ${branding.address}` : '',
    ``,
    `Table  : ${order.tableId}`,
    `Order  : #${String(order._id).slice(-6).toUpperCase()}`,
    `Customer: ${order.user?.name || 'Guest'}`,
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `*Total: LKR ${(order.totalPrice || 0).toLocaleString()}*`,
    branding.taxNumber ? `VAT No: ${branding.taxNumber}` : '',
    ``,
    branding.footerNote || 'Thank you for dining with us! 🙏',
    branding.website    ? branding.website : '',
  ].filter(line => line !== '').join('\n');

  await client.messages.create({ from, to: toNumber, body: message });
};

module.exports = { sendBillWhatsApp };