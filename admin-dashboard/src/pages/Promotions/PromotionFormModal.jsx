import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createPromotion, updatePromotion } from '@/features/promotions/promotionThunks';
import Button from '@/components/common/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const emptyForm = {
  title: '',
  description: '',
  code: '',
  discountType: 'percentage',
  discountValue: '',
  targetSegment: 'All',
  startDate: '',
  endDate: '',
  maxRedemptions: '',
  minOrderAmount: 0,
  // Birthday-specific fields
  isAutomatedBirthdayCampaign: false,
  reminderDaysBefore: 3,
  reminderMessageTemplate:
    'Hi {customerName}! Your birthday is coming up in {reminderDaysBefore} days. Get ready for a special treat from {restaurantName}!',
  birthdayMessageTemplate:
    'Happy Birthday {customerName}! Enjoy {discount} off with code {code}, on us. Valid today only at {restaurantName}!',
};

const PromotionFormModal = ({ isOpen, onClose, editingPromotion }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const isEditMode = Boolean(editingPromotion);
  const isBirthdaySegment = form.targetSegment === 'Birthday';

  useEffect(() => {
    if (editingPromotion) {
      setForm({
        title: editingPromotion.title || '',
        description: editingPromotion.description || '',
        code: editingPromotion.code || '',
        discountType: editingPromotion.discountType || 'percentage',
        discountValue: editingPromotion.discountValue ?? '',
        targetSegment: editingPromotion.targetSegment || 'All',
        startDate: editingPromotion.startDate
          ? editingPromotion.startDate.slice(0, 10)
          : '',
        endDate: editingPromotion.endDate ? editingPromotion.endDate.slice(0, 10) : '',
        maxRedemptions: editingPromotion.maxRedemptions ?? '',
        minOrderAmount: editingPromotion.minOrderAmount ?? 0,
        isAutomatedBirthdayCampaign: editingPromotion.isAutomatedBirthdayCampaign || false,
        reminderDaysBefore: editingPromotion.reminderDaysBefore ?? 3,
        reminderMessageTemplate:
          editingPromotion.reminderMessageTemplate || emptyForm.reminderMessageTemplate,
        birthdayMessageTemplate:
          editingPromotion.birthdayMessageTemplate || emptyForm.birthdayMessageTemplate,
      });
    } else {
      setForm(emptyForm);
    }
    setFormError(null);
  }, [editingPromotion, isOpen]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.discountValue || Number(form.discountValue) <= 0)
      return 'Discount value must be greater than 0';
    if (!form.startDate || !form.endDate) return 'Start and end dates are required';
    if (new Date(form.endDate) <= new Date(form.startDate))
      return 'End date must be after start date';
    if (isBirthdaySegment && !form.code.trim())
      return 'A promo code is required for birthday campaigns (used in the offer message)';
    if (isBirthdaySegment && (form.reminderDaysBefore < 0 || form.reminderDaysBefore > 30))
      return 'Reminder days before must be between 0 and 30';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      reminderDaysBefore: isBirthdaySegment ? Number(form.reminderDaysBefore) : undefined,
    };

    try {
      if (isEditMode) {
        await dispatch(
          updatePromotion({ id: editingPromotion._id || editingPromotion.id, ...payload })
        ).unwrap();
      } else {
        await dispatch(createPromotion(payload)).unwrap();
      }
      onClose();
    } catch (err) {
      setFormError(err || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode ? 'Edit Promotion' : 'New Promotion'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {formError}
            </div>
          )}

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Summer Sale"
            required
          />

          <Input
            label="Promo Code"
            value={form.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            placeholder="SUMMER20"
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Discount Type"
              value={form.discountType}
              onChange={(val) => handleChange('discountType', val)}
              options={[
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed Amount' },
                { value: 'bogo', label: 'Buy One Get One' },
                { value: 'freeItem', label: 'Free Item' },
              ]}
            />
            <Input
              label="Discount Value"
              type="number"
              value={form.discountValue}
              onChange={(e) => handleChange('discountValue', e.target.value)}
              placeholder={form.discountType === 'percentage' ? '20' : '500'}
              required
            />
          </div>

          <Select
            label="Target Segment"
            value={form.targetSegment}
            onChange={(val) => handleChange('targetSegment', val)}
            options={[
              { value: 'All', label: 'All Customers' },
              { value: 'New', label: 'New' },
              { value: 'Regular', label: 'Regular' },
              { value: 'Loyal', label: 'Loyal' },
              { value: 'VIP', label: 'VIP' },
              { value: 'Birthday', label: 'Birthday' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Redemptions (optional)"
              type="number"
              value={form.maxRedemptions}
              onChange={(e) => handleChange('maxRedemptions', e.target.value)}
              placeholder="Unlimited"
            />
            <Input
              label="Min Order Amount"
              type="number"
              value={form.minOrderAmount}
              onChange={(e) => handleChange('minOrderAmount', e.target.value)}
            />
          </div>

          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />

          {/* --- Birthday campaign specific section --- */}
          {isBirthdaySegment && (
            <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4 space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    Automated Birthday Campaign
                  </p>
                  <p className="text-xs text-indigo-600">
                    When enabled, the daily job sends these messages automatically.
                    Only one promotion should have this enabled per restaurant.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isAutomatedBirthdayCampaign}
                  onChange={(e) =>
                    handleChange('isAutomatedBirthdayCampaign', e.target.checked)
                  }
                  className="h-5 w-5 accent-indigo-600 flex-shrink-0"
                />
              </div>

              <Input
                label="Send Reminder How Many Days Before Birthday"
                type="number"
                value={form.reminderDaysBefore}
                onChange={(e) => handleChange('reminderDaysBefore', e.target.value)}
                min={0}
                max={30}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Reminder Message (sent {form.reminderDaysBefore} days before)
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  rows={3}
                  value={form.reminderMessageTemplate}
                  onChange={(e) => handleChange('reminderMessageTemplate', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Placeholders: {'{customerName}'}, {'{restaurantName}'}, {'{reminderDaysBefore}'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Birthday-Day Offer Message
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  rows={3}
                  value={form.birthdayMessageTemplate}
                  onChange={(e) => handleChange('birthdayMessageTemplate', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Placeholders: {'{customerName}'}, {'{code}'}, {'{discount}'}, {'{restaurantName}'}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Promotion'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionFormModal;
