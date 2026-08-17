import React, { useState, useEffect } from 'react';
import { X, Landmark } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/common/Button';

const ManageTransactionModal = ({ isOpen, onClose, onSubmitConfirm, mode = 'capital_management', activeLoans = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Core Form States 
  const [type, setType] = useState('Loan_Disbursement');
  const [sourceOrDestination, setSourceOrDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank_Transfer');
  const [description, setDescription] = useState('');

  // Dynamic Sub-States for Amortized Loans 
  const [interestRate, setInterestRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState(0);
  const [selectedLoanId, setSelectedLoanId] = useState('');

  // Automated Math Logic for Loan EMIs (Equated Monthly Installments)
  useEffect(() => {
    if (type === 'Loan_Disbursement' && amount && interestRate && durationMonths) {
      const P = parseFloat(amount);
      const r = (parseFloat(interestRate) / 100) / 12; // Monthly interest rate
      const n = parseInt(durationMonths);

      if (r === 0) {
        setMonthlyInstallment((P / n).toFixed(2));
      } else {
        // Standard Amortization Formula: EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
        const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        setMonthlyInstallment(emi.toFixed(2));
      }
    }
  }, [amount, interestRate, durationMonths, type]);

  // Adjust input context dynamically when user targets an existing loan repayment
  const handleLoanSelection = (loanId) => {
    setSelectedLoanId(loanId);
    const targetLoan = activeLoans.find(l => l.id === loanId);
    if (targetLoan) {
      setAmount(targetLoan.monthlyInstallment.toString());
      setSourceOrDestination(targetLoan.lenderName);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Structural payload formatting to match backend mongoose schemas
    const payload = {
      type,
      sourceOrDestination,
      amount: parseFloat(amount),
      paymentMethod,
      description,
      ...(type === 'Loan_Disbursement' && {
        loanDetails: {
          interestRate: parseFloat(interestRate),
          durationMonths: parseInt(durationMonths),
          monthlyInstallment: parseFloat(monthlyInstallment)
        }
      }),
      ...(type === 'Loan_Repayment' && { referenceId: selectedLoanId })
    };

    // Push structured payload upward into Interceptor intercept layer (ConfirmModal)
    onSubmitConfirm(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Frosted Backdrop Overlays */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Glassmorphic Modal Body */}
      <div className={cn(
        "relative w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl border transition-all max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200",
        "bg-white/90 border-white/80 shadow-slate-200/50",
        "dark:bg-slate-900/90 dark:border-white/10 dark:shadow-black/60"
      )}>
        
        {/* Close Button Trigger */}
        <button 
          onClick={onClose}
          className={cn(
            "absolute top-6 right-6 p-2 rounded-full transition-colors active:scale-95",
            isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          )}
        >
          <X size={20} />
        </button>

        {/* Form Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Record Capital Flow
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Log strategic injections, repayments, outside holdings or equity alterations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Transaction Category Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transaction Classification
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setAmount('');
                setSourceOrDestination('');
                setSelectedLoanId('');
              }}
              className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm font-medium p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand"
            >
              <option value="Loan_Disbursement">Loan Borrowing (Inflow)</option>
              <option value="Loan_Repayment">Monthly Loan Payment (Outflow)</option>
              <option value="Investment_In">External Money Investment (Inside Platform)</option>
              <option value="Investment_Out">External Money Investment (Outside Assets)</option>
              <option value="Owner_Investment">Owner Capital Injection (Equity In)</option>
              <option value="Owner_Drawing">Owner Personal Drawing (Equity Out)</option>
            </select>
          </div>

          {/* Conditional Layout Row: Loan Repayment Selection Profile */}
          {type === 'Loan_Repayment' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Target Liability Profile
              </label>
              <select
                value={selectedLoanId}
                onChange={(e) => handleLoanSelection(e.target.value)}
                required
                className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand"
              >
                <option value="">-- Choose active facility --</option>
                {activeLoans.length === 0 && (
                  <option value="" disabled>No active loans found</option>
                )}
                {activeLoans.map(loan => (
                  <option key={loan.id} value={loan.id}>
                    {loan.lenderName} (Bal: Rs. {loan.remainingBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Primary Standard Row Input Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {['Loan_Disbursement', 'Loan_Repayment'].includes(type) ? 'Lender / Institution Name' : 'Counterparty Entity Name'}
              </label>
              <input
                type="text"
                required
                value={sourceOrDestination}
                disabled={type === 'Loan_Repayment' && selectedLoanId !== ''}
                onChange={(e) => setSourceOrDestination(e.target.value)}
                placeholder="e.g., Bank of Ceylon, Investor X, Partner Raj"
                className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white disabled:opacity-60 focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Value Amount (LKR)
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          {/* Amortization Specific Nested Configurations */}
          {type === 'Loan_Disbursement' && (
            <div className="p-5 rounded-3xl bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-4 animate-in slide-in-from-top-3 duration-300">
              <p className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
                <Landmark size={14} /> Amortization Scheduling Parametrics
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Annual Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="e.g., 12.5"
                    className="w-full rounded-xl border-slate-200 dark:border-white/10 text-sm p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tenure Terms (Months)</label>
                  <input
                    type="number"
                    required
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    placeholder="e.g., 36"
                    className="w-full rounded-xl border-slate-200 dark:border-white/10 text-sm p-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {monthlyInstallment > 0 && (
                <div className="pt-2 flex justify-between items-center border-t border-slate-200 dark:border-white/5 text-xs font-medium">
                  <span className="text-slate-500">Auto-Calculated Projected Monthly EMI:</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                    Rs. {parseFloat(monthlyInstallment).toLocaleString(undefined, { maximumFractionDigits: 2 })} /mo
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Payment Clearing Modality Options */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Settlement Clear Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Bank_Transfer', 'Cheque', 'Cash'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    "p-3 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all duration-200",
                    paymentMethod === method
                      ? "bg-brand border-brand text-white shadow-md shadow-brand/20"
                      : "bg-white/40 border-slate-200 dark:bg-slate-800/40 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80"
                  )}
                >
                  {method.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Descriptions Text Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit Memorandum / Description Note
            </label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clarifying context logs for future tracking verification statements..."
              className="w-full rounded-2xl border-slate-200 dark:border-white/10 text-sm p-3 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Form Actions Footer Panels */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 rounded-2xl"
            >
              Stage Transaction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageTransactionModal;