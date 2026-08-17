/**
 * Standalone manual test runner for the birthday campaign.
 * node scripts/testBirthdayCampaign.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { runDailyBirthdayCampaigns } = require('../jobs/birthdayCron');
 
async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected. Running birthday campaign check...');
 
    await runDailyBirthdayCampaigns();
 
    console.log('Done.');
  } catch (err) {
    console.error('Test run failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
 
main();
 