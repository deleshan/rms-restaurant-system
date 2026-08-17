const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: String,
      required: true,
      index: true, 
    },
    name: {
      type: String,
      required: [true, 'Please add an item name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be a positive number'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      trim: true,
      index: true,
    },
    image: {
      type: String, 
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    stockLevel: {
      type: Number,
      default: 0, 
    },
    
    dietary: {
      isVegetarian: { type: Boolean, default: false },
      isVegan: { type: Boolean, default: false },
      isGlutenFree: { type: Boolean, default: false },
      isSpicy: { type: Boolean, default: false },
      calories: { type: Number },
    },
    
    customizable: {
      type: Boolean,
      default: false,
    },
    customizationOptions: [
      {
        optionName: { type: String, required: true },
        price:      { type: Number, default: 0 },
        type: {
          type: String,
          enum: ['ADD', 'REMOVE', 'SWAP'],
          default: 'ADD'
        },
        isMandatory: { type: Boolean, default: false },

        ingredientEffects: [
          {
            inventoryItem: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Inventory'
            },
            quantityDelta: { type: Number },
            unit: { type: String, default: 'g' }
          }
        ]
      }
    ],
    
    ingredients: [
      {
        inventoryItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Inventory',
          required: true
        },
        quantityRequired: {
          type: Number,
          required: true,
          min: 0
        },
        unit: {
          type: String,
          default: 'g'  
        },
        isOptional: {
          type: Boolean,
          default: false
        }
      }
    ],
    isOutOfStock: {
      type: Boolean,
      default: false,
    },
    outOfStockIngredients: [{
      inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      name: String,         
      required: Number,      
      available: Number,    
      unit: String,
    }],
    station: {
      type: String,
      enum: ['Hot Station', 'Cold Station', 'Bar / Drinks'],
      required: [true, 'Please assign a station'],
      default: 'Hot Station',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, 
  }
);

// Compound Indexing
MenuItemSchema.index({ restaurantId: 1, name: 1 }, { unique: true });
MenuItemSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('MenuItem', MenuItemSchema);