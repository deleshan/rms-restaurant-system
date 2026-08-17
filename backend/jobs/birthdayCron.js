const cron = require('node-cron');
const Promotion = require('../models/Promotion');
const Customer = require('../models/Customer');
const Restaurant = require('../models/Restaurant');
const { fillTemplate, sendWhatsApp, sendBirthdayEmail } = require('../services/messagingService');
 
/**
 * Checks if a customer's birthday (month + day, ignoring year) falls on
 * a specific target date (month + day, ignoring year).
 */
function isBirthdayOn(dateOfBirth, targetDate) {
  if (!dateOfBirth) return false;
  return (
    dateOfBirth.getMonth() === targetDate.getMonth() &&
    dateOfBirth.getDate() === targetDate.getDate()
  );
}
 
/**
 * Runs the birthday campaign for a single restaurant's automated
 * birthday promotion. Sends:
 *  - a reminder N days before the birthday (default 3)
 *  - the actual offer on the birthday itself
 * Each customer is sent at most once per message type per year,
 * tracked via lastBirthdayReminderSentYear / lastBirthdayOfferSentYear.
 */
async function runBirthdayCampaignForPromotion(promotion) {
  const today = new Date();
  const currentYear = today.getFullYear();
 
  const reminderDate = new Date(today);
  reminderDate.setDate(reminderDate.getDate() + promotion.reminderDaysBefore);
 
  const restaurant = await Restaurant.findById(promotion.restaurantId).lean();
  const restaurantName = restaurant?.name || 'Our Restaurant';

  const discountLabel =
    promotion.discountType === 'percentage'
      ? `${promotion.discountValue}%`
      : `Rs.${promotion.discountValue}`;
 
 
  // Find all customers for this restaurant with a date of birth set,
  // who haven't opted out of marketing.
  const customers = await Customer.find({
    restaurantId: promotion.restaurantId,
    dateOfBirth: { $ne: null },
    optedInForMarketing: true,
    isActive: true,
  });
 
  let remindersSent = 0;
  let offersSent = 0;
 
  for (const customer of customers) {
    const templateData = {
      customerName: customer.name,
      code: promotion.code,
      discount: discountLabel,
      restaurantName,
      reminderDaysBefore: promotion.reminderDaysBefore,
    };
 
    // 3-day-before reminder 
    const alreadyRemindedThisYear =
      customer.lastBirthdayReminderSentYear === currentYear;
 
    if (!alreadyRemindedThisYear && isBirthdayOn(customer.dateOfBirth, reminderDate)) {
      const message = fillTemplate(promotion.reminderMessageTemplate, templateData);
 
      const waOk2 = await sendWhatsApp(customer.phone, message);
      let emailOk = false;
      if (customer.email) {
        emailOk = await sendBirthdayEmail({
          toEmail: customer.email,
          toName: customer.name,
          subject: `${customer.name}, your birthday treat is coming up!`,
          html: `<p>${message}</p>`,
          restaurantName,  
        });
      }
 
      if (waOk2 || emailOk) {
        customer.lastBirthdayReminderSentYear = currentYear;
        await customer.save();
        remindersSent++;
      }
    }
 
    // On-the-day offer 
    const alreadySentOfferThisYear = customer.lastBirthdayOfferSentYear === currentYear;
 
    if (!alreadySentOfferThisYear && isBirthdayOn(customer.dateOfBirth, today)) {
      const message = fillTemplate(promotion.birthdayMessageTemplate, templateData);
 
      const waOk = await sendWhatsApp(customer.phone, message);
      let emailOk = false;
      if (customer.email) {
        emailOk = await sendBirthdayEmail({
          toEmail: customer.email,
          toName: customer.name,
          subject: `Happy Birthday, ${customer.name}! 🎉`,
          html: `<p>${message}</p>`,
          restaurantName,
        });
      }
 
      if (waOk || emailOk) {
        customer.lastBirthdayOfferSentYear = currentYear;
        await customer.save();
        offersSent++;
      }
    }
  }
 
  console.log(
    `[Birthday Campaign] Restaurant ${promotion.restaurantId}: ${remindersSent} reminders, ${offersSent} birthday offers sent.`
  );
}
 
/**
 * Finds every restaurant's active automated birthday promotion and runs
 * the campaign check for each. Designed to be called once per day.
 */
async function runDailyBirthdayCampaigns() {
  try {
    const birthdayPromotions = await Promotion.find({
      targetSegment: 'Birthday',
      isAutomatedBirthdayCampaign: true,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });
 
    if (birthdayPromotions.length === 0) {
      console.log('[Birthday Campaign] No active automated birthday promotions found.');
      return;
    }
 
    for (const promotion of birthdayPromotions) {
      await runBirthdayCampaignForPromotion(promotion);
    }
  } catch (err) {
    console.error('[Birthday Campaign] Failed to run daily check:', err.message);
  }
}
 
/**
 * Registers the daily cron job. Call this once from server.js on startup.
 * Runs every day at 9:00 AM server time — adjust the cron expression
 * if you want a different time.
 */
function scheduleBirthdayCron() {
  // Cron format: second(optional) minute hour day month weekday
  cron.schedule('0 9 * * *', () => {
    console.log('[Birthday Campaign] Running daily birthday check...');
    runDailyBirthdayCampaigns();
  });
 
  console.log('[Birthday Campaign] Daily cron scheduled for 9:00 AM.');
}
 
module.exports = {
  scheduleBirthdayCron,
  runDailyBirthdayCampaigns, 
};