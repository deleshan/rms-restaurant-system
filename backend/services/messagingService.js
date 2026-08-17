const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const mailchimp = require('@mailchimp/mailchimp_marketing');
const crypto = require('crypto');
 
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});
 
/**
 * Fills {placeholder} tokens in a template string with values from a data object.
 * Unmatched placeholders are left as-is rather than throwing, so a missing
 * field doesn't crash a send loop.
 */
function fillTemplate(template, data) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined && data[key] !== null ? data[key] : match;
  });
}

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
 * Sends a single SMS via Twilio to one customer. Swallows/logs its own
 * errors so a failure for one customer doesn't stop the batch.
 */
async function sendWhatsApp(toPhone, message) {
  if (!toPhone) return false;
  const toNumber = `whatsapp:${toE164LK(toPhone)}`;
  try {
    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM, 
      to: toNumber,      
    });
    return true;
  } catch (err) {
    console.error(`WhatsApp error (to ${toPhone}):`, err.message);
    return false;
  }
}

async function ensureMailchimpSubscriber(email, name) {
  const subscriberHash = crypto
    .createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');

  try {
    await mailchimp.lists.setListMember(
      process.env.MAILCHIMP_LIST_ID,
      subscriberHash,
      {
        email_address: email,
        status_if_new: 'subscribed',
        merge_fields: { FNAME: name || '' },
      }
    );
    console.log(`Mailchimp: subscriber ensured for ${email}`);
  } catch (err) {
    console.error(`Mailchimp subscribe error (${email}):`, err.message);
  }
}
 
/**
 * Sends a single transactional-style email via Mailchimp by creating,
 * filling, and sending a one-off campaign scoped to a single recipient
 * via a segment match on email address.
 */
async function sendBirthdayEmail({ toEmail, toName, subject, html, restaurantName }) {
  if (!toEmail) return false;
  const vendorName = restaurantName || 'Restaurant';
  try {
    // Upsert the contact into the list before creating the campaign
    await ensureMailchimpSubscriber(toEmail, toName);

    const campaign = await mailchimp.campaigns.create({
      type: 'regular',
      recipients: {
        list_id: process.env.MAILCHIMP_LIST_ID,
        segment_opts: {
          match: 'all',
          conditions: [
            {
              condition_type: 'EmailAddress',
              field: 'EMAIL',
              op: 'is',
              value: toEmail,
            },
          ],
        },
      },
      settings: {
        subject_line: subject,
        from_name: vendorName || 'Our Restaurant',
        reply_to: process.env.MAILCHIMP_REPLY_TO_EMAIL,
      },
    });

    await mailchimp.campaigns.setContent(campaign.id, { html });
    await mailchimp.campaigns.send(campaign.id);
    return true;
  } catch (err) {
    if (err.response) {
      console.error(
        `Mailchimp full error (${toEmail}):`,
        JSON.stringify(err.response.body || err.response, null, 2)
      );
    } else {
      console.error(`Mailchimp email error (${toEmail}):`, err.message);
    }
    return false;
  }
}


module.exports = {
  fillTemplate,
  sendWhatsApp,
  sendBirthdayEmail,
};
 