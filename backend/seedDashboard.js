const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Review = require('./models/Review');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for seeding...'))
  .catch(err => console.log(err));

const seedData = async () => {
  try {
    // 1. Clear existing data
    await Customer.deleteMany();
    await Order.deleteMany();
    await Review.deleteMany();

    console.log('Old data cleared...');

    // 2. Create Sample Customers (Diverse data for K-Means)
    const customers = await Customer.insertMany([
      {
        name: "John VIP",
        phone: "1112223333",
        restaurantId: "rest_001",
        totalOrders: 50,
        totalSpent: 15000,
        lastVisit: new Date(),
        segment: "VIP"
      },
      {
        name: "Sarah Regular",
        phone: "4445556666",
        restaurantId: "rest_001",
        totalOrders: 10,
        totalSpent: 2500,
        lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        segment: "Regular"
      },
      {
        name: "Mike At-Risk",
        phone: "7778889999",
        restaurantId: "rest_001",
        totalOrders: 20,
        totalSpent: 8000,
        lastVisit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
        segment: "At-Risk"
      }
    ]);

    // 3. Create Sample Orders for Today's Revenue
    await Order.insertMany([
      {
        user: customers[0]._id,
        restaurantId: "rest_001",
        items: [{ name: "Signature Pizza", qty: 2, price: 1200 }],
        totalPrice: 2400,
        status: "Completed",
        customizations: ["Extra Cheese", "Thin Crust"]
      },
      {
        user: customers[1]._id,
        restaurantId: "rest_001",
        items: [{ name: "Pasta Carbonara", qty: 1, price: 950 }],
        totalPrice: 950,
        status: "Pending",
        customizations: ["No Garlic"]
      }
    ]);

    // 4. Create Sample Reviews for Sentiment Analysis
    await Review.insertMany([
      {
        customerName: "John VIP",
        comment: "Absolutely amazing food and service!",
        rating: 5,
        sentiment: { score: 0.8, label: "Positive" }
      },
      {
        customerName: "Mike At-Risk",
        comment: "The food was cold and late. Very disappointed.",
        rating: 2,
        sentiment: { score: -0.6, label: "Negative" }
      }
    ]);

    console.log('Database Seeded Successfully! 🌱');
    process.exit();
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();