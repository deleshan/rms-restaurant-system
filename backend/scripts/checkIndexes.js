require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const indexes = await mongoose.connection.db.collection('customers').indexes();
  console.log(JSON.stringify(indexes, null, 2));
  await mongoose.disconnect();
})();