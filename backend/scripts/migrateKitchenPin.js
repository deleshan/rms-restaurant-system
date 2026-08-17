const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const db = mongoose.connection.db;
  const settings = await db.collection('settings').find({}).toArray();

  for (const s of settings) {
    if (!s.kitchenPin.startsWith('$2')) {
      const hashed = await bcrypt.hash(s.kitchenPin, 10);
      await db.collection('settings').updateOne(
        { _id: s._id },
        { $set: { kitchenPin: hashed } }
      );
      console.log(`Migrated PIN for: ${s.kitchenUsername}`);
    } else {
      console.log(`Already hashed: ${s.kitchenUsername}`);
    }
  }

  await mongoose.disconnect();
  console.log('Migration complete.');
}

migrate().catch(console.error);