const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Salaries',
      'Rent',
      'Utilities',
      'Ingredients',
      'Marketing',
      'Maintenance',
      'Supplies',
      'Taxes',
      'Insurance',
      'Interest',
      'Cleaning',
      'Delivery',
      'Other',
    ],
    default: 'Other',
  },
  description: {
    type: String,
    required: false,
    trim: true,
  },
  paidTo: {
    type: String,
    trim: true,
    default: '',
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'],
    default: 'Cash',
  },
  receiptImage: {
    type: String, 
    default: '',
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  restaurantId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Restaurant',
  required: true,
  index: true, 
  },
  transactionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null,
  },
  editedAt: { type: Date, default: null },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true, 
});


ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ addedBy: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);