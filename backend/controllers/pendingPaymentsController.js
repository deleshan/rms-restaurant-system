const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const PAYABLE_CATEGORIES = ['PURCHASE', 'ASSET_PURCHASE'];

// @desc  List all outstanding bills (unpaid inventory + asset purchases)
// @route GET /api/finance/payables
const getPendingPayments = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const bills = await Transaction.find({
      restaurant: restaurantId,
      status: 'PENDING',
      category: { $in: PAYABLE_CATEGORIES },
    }).sort({ 'details.dueDate': 1, date: -1 });

    const now = new Date();
    const data = bills.map((t) => ({
      _id: t._id,
      date: t.date,
      dueDate: t.details?.dueDate || null,
      isOverdue: t.details?.dueDate ? new Date(t.details.dueDate) < now : false,
      category: t.category,               // 'PURCHASE' | 'ASSET_PURCHASE'
      description: t.description,
      supplier: t.details?.counterparty || 'Unknown',
      amount: t.amount,
      defaultPaymentMethod: t.paymentMethod,
    }));

    const totalOwed = data.reduce((s, b) => s + b.amount, 0);
    const overdueTotal = data.filter(b => b.isOverdue).reduce((s, b) => s + b.amount, 0);
    const byCategory = {
      inventory: data.filter(b => b.category === 'PURCHASE').reduce((s, b) => s + b.amount, 0),
      assets: data.filter(b => b.category === 'ASSET_PURCHASE').reduce((s, b) => s + b.amount, 0),
    };

    res.status(200).json({
      success: true,
      data: { bills: data, totalOwed, overdueTotal, byCategory, count: data.length },
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Settle an outstanding bill — triggers the deferred cash outflow
// @route PATCH /api/finance/payables/:id/pay
const payBill = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    const { paymentMethod, paidDate } = req.body;

    const bill = await Transaction.findOne({
      _id: id, restaurant: restaurantId, status: 'PENDING',
      category: { $in: PAYABLE_CATEGORIES },
    });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found or already settled' });
    }

    const paymentMethodMap = {
      'Cash': 'CASH', 'Bank_Transfer': 'BANK_TRANSFER',
      'Cheque': 'BANK_TRANSFER', 'Card': 'CARD', 'Other': 'CASH',
    };

    bill.status = 'COMPLETED';
    bill.paymentMethod = paymentMethodMap[paymentMethod] || bill.paymentMethod;
    bill.details.paidDate = paidDate || new Date();
    await bill.save();   

    res.status(200).json({ success: true, message: 'Bill marked as paid', data: bill });
  } catch (error) {
    console.error('Pay bill error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPendingPayments, payBill };