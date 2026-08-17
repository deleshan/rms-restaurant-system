const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true 
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },

  type: {
    type: String,
    enum: ['INCOME', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'SALES', 'PURCHASE', 'COGS','SALARY',          
      'UTILITY',         
      'RENT',            
      'MAINTENANCE',     
      'OPENING_BALANCE', 
      'TAX',             
      'ASSET_GAIN', 'ASSET_LOSS',
      'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT',
      'INVESTMENT_IN', 'INVESTMENT_OUT',
      'OWNER_INVESTMENT', 'OWNER_DRAWING',
      'ASSET_PURCHASE', 'ASSET_DISPOSAL',
      'OPENING_STOCK', 'OPENING_ASSET', 'OPENING_LOAN', 'OPENING_CAPITAL',
      'OTHER'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },

 
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE_WALLET', 'MULTIPLE'],
    default: 'CASH'
  },
  details: {
    // Assets
    cashComponent: { type: Number, default: 0 },
    bankComponent: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    accountsReceivable: { type: Number, default: 0 },
    propertyEquipment: { type: Number, default: 0 },
    accumulatedDepreciation: { type: Number, default: 0 },
    
    // Liabilities (Add these specific fields!)
    accountsPayable: { type: Number, default: 0 },
    shortTermDebt: { type: Number, default: 0 },
    longTermLoans: { type: Number, default: 0 },
    
    // Equity (Add these specific fields!)
    ownerCapital: { type: Number, default: 0 },
    retainedEarnings: { type: Number, default: 0 },

    counterparty: { type: String },
    interestRate: { type: Number },
    durationMonths: { type: Number },
    monthlyInstallment: { type: Number },
    loanReferenceId: { type: String },
    debtBucket: { type: String, enum: ['shortTermDebt', 'longTermLoans'] },
    principalPortion: { type: Number },
    interestPortion: { type: Number },
    assetId: { type: mongoose.Schema.Types.ObjectId },          
    assetBookValueAtSale: { type: Number },
    referenceNumber: { type: String },
    isInitialSetup: { type: Boolean, default: false },
    dueDate: { type: Date },
    paidDate: { type: Date },
  },

  // METADATA & AUDIT
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'VOIDED', 'REFUNDED'],
    default: 'COMPLETED'
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500
  },
  date: {
    type: Date,
    default: Date.now,
    index: true 
  },
  isSystemGenerated: {
    type: Boolean,
    default: false 
  },
  attachments: [{ type: String }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// VIRTUALS
transactionSchema.virtual('isCredit').get(function() {
  return this.type === 'INCOME' || this.category === 'OPENING_BALANCE';
});

// AUTOMATIC BALANCE UPDATES (Middleware)
transactionSchema.post('save', async function() {
  if (this.category === 'COGS') {
    console.log(`[COGS-TRACE] 5. post-save hook firing for COGS txn ${this._id}, amount=${this.amount}`);
  }
  
  const Restaurant = mongoose.model('Restaurant');
  if (this.status !== 'COMPLETED') {
    console.warn(`[COGS-TRACE] ⚠️ Transaction ${this._id} status=${this.status}, NOT COMPLETED — balance update skipped`);
    return;
  }

  const isOutflow = this.type === 'EXPENSE';
  const isOpening = this.category === 'OPENING_BALANCE';
  const multiplier = isOutflow ? -1 : 1;

  if (isOpening) {
    const d = this.details;
    const totalLiabilities = (d.accountsPayable || 0) + (d.shortTermDebt || 0) + (d.longTermLoans || 0);
    const totalEquity = (d.ownerCapital || 0) + (d.retainedEarnings || 0);

    await Restaurant.findByIdAndUpdate(this.restaurant, {
      $set: { 
        isInitialized: true,
        'currentBalance.cash': d.cashComponent || 0,
        'currentBalance.bank': d.bankComponent || 0,
        'currentBalance.inventoryValue': d.inventoryValue || 0,
        'currentBalance.accountsReceivable': d.accountsReceivable || 0,
        'currentBalance.propertyEquipment': d.propertyEquipment || 0,
        'currentBalance.accumulatedDepreciation': d.accumulatedDepreciation || 0,
        'currentBalance.accountsPayable': d.accountsPayable || 0,
        'currentBalance.shortTermDebt': d.shortTermDebt || 0,
        'currentBalance.longTermLoans': d.longTermLoans || 0,
        'currentBalance.ownerCapital': d.ownerCapital || 0,
        'currentBalance.retainedEarnings': d.retainedEarnings || 0,
        'currentBalance.total': (d.cashComponent || 0) + (d.bankComponent || 0),
        
        openingAuditTrail: {
          initialDate: this.date,
          setupBy: this.user,
          snapshot: {
            cash: d.cashComponent,
            bank: d.bankComponent,
            inventory: d.inventoryValue,
            receivables: d.accountsReceivable,
            fixedAssets: (d.propertyEquipment || 0) - (d.accumulatedDepreciation || 0),
            liabilities: totalLiabilities,
            equity: totalEquity
          }
        }
      }
    });
} else {
    // STANDARD TRANSACTIONS
    const OPENING_ENTRY_CATEGORIES = ['OPENING_STOCK', 'OPENING_ASSET', 'OPENING_LOAN', 'OPENING_CAPITAL'];
    const NON_CASH_CATEGORIES = ['ASSET_GAIN', 'ASSET_LOSS', 'COGS', ...OPENING_ENTRY_CATEGORIES];
    const skipCash = this.details?.isInitialSetup === true;

    let cashChange = 0;
    let bankChange = 0;

    if (!NON_CASH_CATEGORIES.includes(this.category) && !skipCash) {
      if (this.paymentMethod === 'MULTIPLE') {
        cashChange = (this.details.cashComponent || 0) * multiplier;
        bankChange = (this.details.bankComponent || 0) * multiplier;
      } else if (this.paymentMethod === 'CASH') {
        cashChange = this.amount * multiplier;
      } else {
        bankChange = this.amount * multiplier;
      }
    }

    const balanceUpdate = {
      'currentBalance.cash': cashChange,
      'currentBalance.bank': bankChange,
      'currentBalance.total': cashChange + bankChange,
    };

    // capital-structure side effects
    const CAPITAL_CATEGORIES = [
      'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT',
      'INVESTMENT_IN', 'INVESTMENT_OUT',
      'OWNER_INVESTMENT', 'OWNER_DRAWING',
      'OPENING_LOAN', 'OPENING_CAPITAL',
    ];

    if (CAPITAL_CATEGORIES.includes(this.category)) {
      switch (this.category) {
        case 'LOAN_DISBURSEMENT':
        case 'OPENING_LOAN': {
          const bucket = this.details.debtBucket === 'shortTermDebt' ? 'shortTermDebt' : 'longTermLoans';
          balanceUpdate[`currentBalance.${bucket}`] = this.amount;
          break;
        }
        case 'INVESTMENT_IN':
        case 'OWNER_INVESTMENT':
        case 'OPENING_CAPITAL':
          balanceUpdate['currentBalance.ownerCapital'] = this.amount;
          break;
        case 'OWNER_DRAWING':
          balanceUpdate['currentBalance.ownerCapital'] = -this.amount;
          break;
        case 'INVESTMENT_OUT':
          balanceUpdate['currentBalance.externalInvestmentsHeld'] = this.amount;
          break;
      }
    }

    if (this.category === 'ASSET_PURCHASE' || this.category === 'OPENING_ASSET') {
    balanceUpdate['currentBalance.propertyEquipment'] = this.amount;
    }
    if (this.category === 'ASSET_DISPOSAL') {
      balanceUpdate['currentBalance.propertyEquipment'] = -(this.details.assetBookValueAtSale || 0);
    }
    if (this.category === 'PURCHASE' || this.category === 'OPENING_STOCK') {
      balanceUpdate['currentBalance.inventoryValue'] = this.amount;
    }
    if (this.category === 'COGS') {
      balanceUpdate['currentBalance.inventoryValue'] = -this.amount;
    }

    await Restaurant.findByIdAndUpdate(this.restaurant, { $inc: balanceUpdate });

    if (this.category === 'LOAN_REPAYMENT' && this.details.loanReferenceId) {
      const TransactionModel = mongoose.model('Transaction');
      const originalLoan = await TransactionModel.findById(this.details.loanReferenceId);
      if (originalLoan) {
        const bucket = originalLoan.details.debtBucket === 'shortTermDebt' ? 'shortTermDebt' : 'longTermLoans';
        const principal = this.details.principalPortion ?? this.amount;
        await Restaurant.findByIdAndUpdate(this.restaurant, {
          $inc: { [`currentBalance.${bucket}`]: -principal },
        });
      }
    }
  }
});

// INDEXES
transactionSchema.index({ restaurant: 1, date: -1 });
transactionSchema.index({ restaurant: 1, category: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;