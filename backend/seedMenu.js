require('dotenv').config({ path: __dirname + '/.env', debug: true });
 
console.log('Loaded environment variables:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'MISSING');
 
if (!process.env.MONGO_URI) {
  console.error('\nERROR: MONGO_URI is missing in backend/.env');
  process.exit(1);
}
 
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const Inventory = require('./models/Inventory');
 
// ⚠️ Replace with a real Restaurant ObjectId from your Restaurant collection.
// Must be the SAME restaurantId you used when bulk-importing inventory_import_test.csv
const RESTAURANT_ID = '699d521d6f0a542e02cdf644';
 
/**
 * Looks up an Inventory item by name (case-insensitive) for this restaurant.
 * Throws a clear error if it's missing, instead of silently seeding a broken ref.
 */
async function getInventoryId(name) {
  const item = await Inventory.findOne({
    restaurantId: RESTAURANT_ID,
    name: { $regex: new RegExp(`^${name}$`, 'i') }
  });
 
  if (!item) {
    throw new Error(
      `Missing inventory item: "${name}". ` +
      `Import inventory_import_test.csv via Bulk Import first, then re-run this seed script.`
    );
  }
  return item._id;
}
 
async function buildMenuItems() {
  // Resolve every ingredient name to its real Inventory _id up front.
  // If any are missing, this throws immediately with a clear message
  // instead of failing partway through insertMany.
  const ids = {
    chicken:  await getInventoryId('Chicken breast'),
    tomato:   await getInventoryId('Tomato'),
    cream:    await getInventoryId('Heavy cream'),
    rice:     await getInventoryId('Basmati rice'),
    paneer:   await getInventoryId('Cottage cheese'), // closest USDA match for paneer
    flour:    await getInventoryId('All purpose flour'),
    garlic:   await getInventoryId('Garlic'),
    mango:    await getInventoryId('Mango'),
    yogurt:   await getInventoryId('Plain yogurt'),
    potato:   await getInventoryId('Potato'),
    onion:    await getInventoryId('Red onion'),
    cheddar:  await getInventoryId('Cheddar cheese'),
  };
 
  return [
    {
      restaurantId: RESTAURANT_ID,
      name: 'Butter Chicken',
      description: 'Tender chicken in creamy tomato gravy with aromatic spices',
      price: 850,
      category: 'Main Course',
      station: 'Hot Station',
      image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
      isAvailable: true,
      dietary: { isVegetarian: false, isSpicy: true },
      customizable: true,
      ingredients: [
        { inventoryItem: ids.chicken, quantityRequired: 500, unit: 'g', isOptional: false },
        { inventoryItem: ids.tomato,  quantityRequired: 300, unit: 'g', isOptional: false },
        { inventoryItem: ids.cream,   quantityRequired: 200, unit: 'ml', isOptional: false },
      ],
      customizationOptions: [
        {
          optionName: 'No Onions',
          price: 0,
          type: 'REMOVE',
          isMandatory: false,
          ingredientEffects: [
            { inventoryItem: ids.onion, quantityDelta: -50, unit: 'g' }
          ]
        },
        {
          optionName: 'Extra Cheese',
          price: 150,
          type: 'ADD',
          isMandatory: false,
          ingredientEffects: [
            { inventoryItem: ids.cheddar, quantityDelta: 50, unit: 'g' }
          ]
        }
      ],
      notes: 'Popular dish',
    },
    {
      restaurantId: RESTAURANT_ID,
      name: 'Chicken Biryani',
      description: 'Fragrant basmati rice layered with spiced chicken',
      price: 950,
      category: 'Main Course',
      station: 'Hot Station',
      image: 'https://images.unsplash.com/photo-1593253784599-5316b3c2e023?w=800',
      isAvailable: true,
      dietary: { isVegetarian: false, isSpicy: true },
      customizable: true,
      ingredients: [
        { inventoryItem: ids.chicken, quantityRequired: 400, unit: 'g', isOptional: false },
        { inventoryItem: ids.rice,    quantityRequired: 500, unit: 'g', isOptional: false },
      ],
      customizationOptions: [
        {
          optionName: 'No Garlic',
          price: 0,
          type: 'REMOVE',
          isMandatory: false,
          ingredientEffects: [
            { inventoryItem: ids.garlic, quantityDelta: -20, unit: 'g' }
          ]
        }
      ],
      notes: 'Best seller',
    },
    {
      restaurantId: RESTAURANT_ID,
      name: 'Paneer Butter Masala',
      description: 'Cottage cheese in rich tomato-butter gravy',
      price: 750,
      category: 'Main Course',
      station: 'Hot Station',
      image: 'https://images.unsplash.com/photo-1626645738305-2b1c7d4c3e3d?w=800',
      isAvailable: true,
      dietary: { isVegetarian: true, isSpicy: false },
      customizable: true,
      ingredients: [
        { inventoryItem: ids.paneer, quantityRequired: 400, unit: 'g', isOptional: false },
        { inventoryItem: ids.tomato, quantityRequired: 300, unit: 'g', isOptional: false },
      ],
      customizationOptions: [
        {
          optionName: 'Extra Cheese',
          price: 150,
          type: 'ADD',
          isMandatory: false,
          ingredientEffects: [
            { inventoryItem: ids.cheddar, quantityDelta: 50, unit: 'g' }
          ]
        }
      ],
      notes: 'Vegetarian favorite',
    },
    {
      restaurantId: RESTAURANT_ID,
      name: 'Garlic Naan',
      description: 'Soft flatbread topped with fresh garlic and butter',
      price: 100,
      category: 'Breads',
      station: 'Hot Station',
      image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
      isAvailable: true,
      dietary: { isVegetarian: true, isSpicy: false },
      customizable: false,
      ingredients: [
        { inventoryItem: ids.flour,  quantityRequired: 200, unit: 'g', isOptional: false },
        { inventoryItem: ids.garlic, quantityRequired: 50,  unit: 'g', isOptional: false },
      ],
      customizationOptions: [],
      notes: 'Side bread',
    },
    {
      restaurantId: RESTAURANT_ID,
      name: 'Mango Lassi',
      description: 'Refreshing yogurt-based mango drink',
      price: 200,
      category: 'Beverages',
      station: 'Bar / Drinks',
      image: 'https://images.unsplash.com/photo-1626645738305-2b1c7d4c3e3d?w=800',
      isAvailable: true,
      dietary: { isVegetarian: true, isSpicy: false },
      customizable: true,
      ingredients: [
        { inventoryItem: ids.mango,  quantityRequired: 300, unit: 'g', isOptional: false },
        { inventoryItem: ids.yogurt, quantityRequired: 200, unit: 'ml', isOptional: false },
      ],
      customizationOptions: [
        {
          optionName: 'Extra Mango',
          price: 100,
          type: 'ADD',
          isMandatory: false,
          ingredientEffects: [
            { inventoryItem: ids.mango, quantityDelta: 100, unit: 'g' }
          ]
        }
      ],
      notes: 'Cooling drink',
    },
    {
      restaurantId: RESTAURANT_ID,
      name: 'Vegetable Samosa',
      description: 'Crispy pastry filled with spiced vegetables',
      price: 300,
      category: 'Appetizers',
      station: 'Hot Station',
      image: 'https://images.unsplash.com/photo-1601050690597-7d3a2d3b7f6a?w=800',
      isAvailable: false,
      dietary: { isVegetarian: true, isSpicy: true },
      customizable: false,
      ingredients: [
        { inventoryItem: ids.potato, quantityRequired: 500, unit: 'g', isOptional: false },
        { inventoryItem: ids.flour,  quantityRequired: 300, unit: 'g', isOptional: false },
      ],
      customizationOptions: [],
      notes: 'Popular starter',
    },
  ];
}
 
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Successfully connected to MongoDB for seeding');
 
  try {
    const menuItems = await buildMenuItems();
 
    // Optional: clear old menu items for this restaurant before reseeding
    // await MenuItem.deleteMany({ restaurantId: RESTAURANT_ID });
 
    const inserted = await MenuItem.insertMany(menuItems, { ordered: false });
    console.log(`Successfully seeded ${inserted.length} menu items!`);
  } catch (err) {
    if (err.message?.includes('Missing inventory item')) {
      console.error(`\n${err.message}\n`);
    } else if (err.code === 11000) {
      console.error('\nDuplicate menu item name for this restaurant — some items may already exist.');
      console.error(err.message);
    } else {
      console.error('\nSeeding failed:', err.message);
    }
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed.');
  }
}
 
run();