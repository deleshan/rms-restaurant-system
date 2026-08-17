import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Save, AlertCircle } from 'lucide-react';
import { recordTransaction, updateExpense, fetchFinanceOverview, fetchExpenditures } from '@/features/finance/financeThunks';
import { selectIsSubmitting } from '@/features/finance/financeSelector';
import Button from '@/components/common/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const TransactionModal = ({ isOpen, onClose, type = 'expense', mode = 'create', initialData = null, }) => {
  const dispatch = useDispatch();
  const isSubmitting = useSelector(selectIsSubmitting);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    amount: '',
    paidTo: '',
    paymentMethod: 'Cash'
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        date: initialData.date
          ? new Date(initialData.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        description: initialData.description || '',
        category: initialData.category || '',
        amount: initialData.amount ?? '',
        paidTo: initialData.paidTo || '',
        paymentMethod: initialData.paymentMethod || 'Cash',
      });
    } else if (mode === 'create') {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        amount: '',
        paidTo: '',
        paymentMethod: 'Cash',
      });
    }
    setError('');
  }, [mode, initialData, isOpen]);

  const [error, setError] = useState('');

  const categories = type === 'expense' 
    ? [
        'Salaries',
        'Rent',
        'Utilities',
        'Ingredients',
        'Marketing',
        'Maintenance',
        'Supplies',
        'Taxes',
        'Insurance',
        'Cleaning',
        'Delivery',
        'Other',
      ]
    : ['Sales', 'Investment', 'Refund', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.amount || formData.amount <= 0) {
      return setError('Please enter a valid amount');
    }
    if (!formData.category) {
      return setError('Please select a category');
    }

    if (mode === 'edit') {
      const result = await dispatch(
        updateExpense({ id: initialData._id, ...formData })
      );

      if (updateExpense.fulfilled.match(result)) {
        dispatch(fetchFinanceOverview());
        dispatch(fetchExpenditures({ period: 'thisMonth' }));
        onClose();
      } else {
        setError(result.payload || 'Failed to update expense. Please try again.');
      }
      return;
    }

    const result = await dispatch(recordTransaction({ ...formData, type }));
    
    if (recordTransaction.fulfilled.match(result)) {
      dispatch(fetchFinanceOverview());
      dispatch(fetchExpenditures({ period: 'thisMonth' }));
      onClose();
    } else {
      setError('Failed to save transaction. Please try again.');
    }
  };

  if (!isOpen) return null;
  const isEdit = mode === 'edit';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit
              ? 'Edit Expense'
              : type === 'expense'
              ? 'Record New Expense'
              : 'Record New Income'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (LKR)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Select
              value={formData.category}
              onChange={(val) => setFormData({ ...formData, category: val })}
              options={categories.map(c => ({ value: c, label: c }))}
              placeholder="Select Category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input
              placeholder="e.g. Monthly Electricity Bill"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'expense' ? 'Paid To' : 'Received From'}
            </label>
            <Input
              placeholder="Name of vendor or person"
              value={formData.paidTo}
              onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              type="submit"
              loading={isSubmitting}
              leftIcon={<Save size={18} />}
            >
              {isEdit ? 'Update Record' : 'Save Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;