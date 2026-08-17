import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { updateInventoryItem } from '@/features/inventory/inventoryThunks';
import Button from '@/components/common/Button';
import Select from '@/components/ui/Select';

const UNIT_OPTIONS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'l', label: 'Litres (l)' },
  { value: 'piece', label: 'Piece' },
  { value: 'pcs', label: 'Pieces' },
];

const InventoryEditModal = ({ isOpen, onClose, item }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ costPerUnit: '', expiryDate: '', unit: 'g' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        costPerUnit: item.costPerUnit ?? '',
        expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
        unit: item.unit || 'g',
      });
      setError('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const unitChanged = form.unit !== item.unit;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const result = await dispatch(updateInventoryItem({
      id: item._id || item.id,
      costPerUnit: Number(form.costPerUnit) || 0,
      expiryDate: form.expiryDate || null,
      unit: form.unit,
    }));
    setSaving(false);

    if (result.type.endsWith('/rejected')) {
      setError(result.payload || 'Failed to save changes');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Asset</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="text-slate-400" />
          </button>
        </div>

        <p className="text-sm font-bold text-slate-500 mb-6">{item.name}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
              Unit Price (LKR)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.costPerUnit}
              onChange={(e) => setForm(f => ({ ...f, costPerUnit: e.target.value }))}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
              Expiry Date
            </label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm(f => ({ ...f, expiryDate: e.target.value }))}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">
              Stocking Unit
            </label>
            <Select
              value={form.unit}
              onChange={(val) => setForm(f => ({ ...f, unit: val }))}
              options={UNIT_OPTIONS}
              className="h-12"
            />
            {unitChanged && (
              <p className="text-[10px] text-amber-600 font-bold mt-2">
                Changing units converts existing stock ({item.currentStock} {item.unit}) into {form.unit} automatically. Only compatible unit families (e.g. g ↔ kg) can convert — g ↔ ml will be rejected.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <Button variant="white" fullWidth onClick={onClose} className="rounded-2xl h-12 font-black uppercase text-xs">
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={handleSave} disabled={saving} className="rounded-2xl h-12 font-black uppercase text-xs">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InventoryEditModal;