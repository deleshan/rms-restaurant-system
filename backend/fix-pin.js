const mongoose = require('mongoose');
const Settings = require('./models/Settings');

const MONGO_URI = process.env.MONGO_URI;   // ← CHANGE THIS

const fixPins = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const settingsList = await Settings.find({});

    for (let settings of settingsList) {
      console.log(`Processing restaurant: ${settings.restaurantId}`);

      // Force re-save to trigger hashing
      settings.kitchenPin = "1234";
      await settings.save();

      console.log(` PIN hashed successfully for ${settings.kitchenUsername}`);
    }

    console.log("All kitchen PINs have been re-hashed!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

fixPins();