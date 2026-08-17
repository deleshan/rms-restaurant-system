import React, { useState, useEffect } from 'react';
import { X, Landmark, RotateCcw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/common/Button';

const LoanModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [counterparty, setCounterparty] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState(0);
  const [installmentTouched, setInstallmentTouched] = useState(false);
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCounterparty(initialData.counterparty || '');
        setPrincipalAmount(initialData.principalAmount?.toString() || '');
        setInterestRate(initialData.interestRate?.toString() || '');
        setDurationMonths(initialData.durationMonths?.toString() || '');
        setMonthlyInstallment(initialData.monthlyInstallment || 0);
        setInstallmentTouched(true); 
        setDisbursementDate(initialData.disbursementDate || new Date().toISOString().split('T')[0]);
      } else {
        setCounterparty(''); setPrincipalAmount(''); setInterestRate('');
        setDurationMonths(''); setMonthlyInstallment(0); setInstallmentTouched(false);
        setDisbursementDate(new Date().toISOString().split('T')[0]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  
  useEffect(() => {
    if (principalAmount && durationMonths) {
      const P = parseFloat(principalAmount);
      const r = (parseFloat(interestRate || 0) / 100) / 12;
      const n = parseInt(durationMonths);

      let emi;
      if (r === 0) {
        emi = (P / n).toFixed(2);
      } else {
        emi = ((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)).toFixed(2);
      }
      if (!installmentTouched) setMonthlyInstallment(emi);
    }
  }, [principalAmount, interestRate, durationMonths, installmentTouched]);

  if (!isOpen) return null;

  const debtBucket = durationMonths && Number(durationMonths) <= 12 ? 'Short-Term' : 'Long-Term';

  const validate = () => {
    const e = {};
    if (!counterparty.trim()) e.counterparty = 'Lender name is required';
    if (!principalAmount || Number(principalAmount) <= 0) e.principalAmount = 'Enter a valid remaining principal';
    if (!durationMonths || Number(durationMonths) <= 0) e.durationMonths = 'Enter remaining duration in months';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }

    onSave({
      counterparty: counterparty.trim(),
      principalAmount: parseFloat(principalAmount),
      interestRate: parseFloat(interestRate) || 0,
      durationMonths: parseInt(durationMonths),
      monthlyInstallment: parseFloat(monthlyInstallment) || 0,
      disbursementDate,
    });
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className={cn(
        "relative w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl border transition-all max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200",
        "bg-white/90 border-white/80 shadow-slate-200/50",
        "dark:bg-slate-900/90 dark:border-white/10 dark:shadow-black/60"
      )}>
        <button
          onClick={onClose}
          className={cn(
            "absolute top-6 right-6 p-2 rounded-full transition-colors active:scale-95",
            isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          )}
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {initialData ? 'Edit Opening Loan' : 'Add Opening Loan'}
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Record a remaining loan balance as of your opening balance date
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lender / Institution Name
              </label>
              <input
                type="text"
                required
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                placeholder="e.g., Bank of Ceylon"
                className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand"
              />
              {errors.counterparty && <p className="text-[10px] text-rose-500 mt-1">{errors.counterparty}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Remaining Principal (LKR)
              </label>
              <input
                type="number"
                required
                min="1"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-brand"
              />
              {errors.principalAmount && <p className="text-[10px] text-rose-500 mt-1">{errors.principalAmount}</p>}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-4">
            <p className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Landmark size={14} /> Amortization Scheduling Parametrics
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="e.g., 12.5"
                  className="w-full rounded-xl border-slate-200 dark:border-white/10 text-sm p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Remaining Duration (Months)</label>
                <input
                  type="number"
                  required
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  placeholder="e.g., 36"
                  className="w-full rounded-xl border-slate-200 dark:border-white/10 text-sm p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                {errors.durationMonths && <p className="text-[10px] text-rose-500 mt-1">{errors.durationMonths}</p>}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className="text-slate-500">Monthly Installment (EMI):</span>
                {installmentTouched && (
                  <button
                    type="button"
                    onClick={() => setInstallmentTouched(false)}
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700"
                  >
                    <RotateCcw size={11} /> Reset to Calculated
                  </button>
                )}
              </div>
              <input
                type="number"
                value={monthlyInstallment}
                onChange={(e) => { setMonthlyInstallment(e.target.value); setInstallmentTouched(true); }}
                className="w-full rounded-xl border-2 border-brand/30 text-sm p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-extrabold"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Classified as: <span className={debtBucket === 'Short-Term' ? 'text-amber-600' : 'text-rose-600'}>{debtBucket} Debt</span>
              <span className="text-slate-300">·</span> ≤12 months = short-term
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Disbursement Date
            </label>
            <input
              type="date"
              value={disbursementDate}
              onChange={(e) => setDisbursementDate(e.target.value)}
              className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <Button variant="outline" className="flex-1 rounded-2xl" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 rounded-2xl">
              {initialData ? 'Save Changes' : 'Add Loan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanModal;