require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await mongoose.connection.db.collection('customers').dropIndex('phone_1');
    console.log('Dropped index:', result);
  } catch (err) {
    console.error('Error dropping index:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();