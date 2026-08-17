const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function migrateCollection(db, collectionName) {
  const docs = await db.collection(collectionName).find({
    restaurantId: { $type: 'string' }
  }).toArray();

  console.log(`${collectionName}: found ${docs.length} docs with string restaurantId`);

  for (const doc of docs) {
    await db.collection(collectionName).updateOne(
      { _id: doc._id },
      { $set: { restaurantId: new mongoose.Types.ObjectId(doc.restaurantId) } }
    );
  }

  console.log(`${collectionName}: migration complete`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await migrateCollection(mongoose.connection.db, 'expenses');
  await migrateCollection(mongoose.connection.db, 'assets');

  await mongoose.connection.close();
  console.log('Done, connection closed.');
}
run();