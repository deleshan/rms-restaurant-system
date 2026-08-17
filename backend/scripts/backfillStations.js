require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

const STATION_MAP = {
  'Beverages': 'Bar / Drinks',
  'Desserts': 'Cold Station',
  'Appetizers': 'Hot Station',
  'Main Course': 'Hot Station',
  'Sides': 'Hot Station',
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const items = await MenuItem.find({ station: { $exists: false } });
  for (const item of items) {
    item.station = STATION_MAP[item.category] || 'Hot Station';
    await item.save();
  }
  console.log(`Backfilled ${items.length} items`);
  process.exit(0);
}
run();