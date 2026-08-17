import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Banknote, Truck, Landmark, UserCircle, Calculator, PartyPopper,
  ArrowRight, ArrowLeft, Plus, Trash2, Package, Receipt, CheckCircle2, RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { setInitialBalance } from '@/features/finance/financeThunks';
import OpeningInventoryStep from '../Inventory/OpeningInventoryStep';
import LoanModal from './FinancialTransactions/LoanModal';

const STEPS = ['Cash & Bank', 'Inventory', 'Assets', 'Loans', 'Payables', "Owner's Capital", 'Review'];

const ASSET_TYPES = ['Vehicle','Equipment & Tools','Furniture','Machinery','Building','Land'];

// Generic repeatable-row list editor (used by Assets / Loans / Payables steps)
const RepeatableList = ({ items, setItems, emptyRow, renderRow, addLabel }) => (
  <div className="space-y-4">
    {items.map((row, idx) => (
      <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative">
        <button
          onClick={() => setItems(items.filter((_, i) => i !== idx))}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500"
        >
          <Trash2 size={14} />
        </button>
        {renderRow(row, (updates) => {
          const next = [...items];
          next[idx] = { ...next[idx], ...updates };
          setItems(next);
        })}
      </div>
    ))}
    <button
      onClick={() => setItems([...items, { ...emptyRow }])}
      className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
    >
      <Plus size={14} /> {addLabel}
    </button>
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{children}</label>
);

const TextField = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-sm bg-white"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-sm bg-white"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const OpeningBalanceWizard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const [cash, setCash] = useState({
    cashAmount: '', bankAmount: '',
    asOfDate: new Date().toISOString().split('T')[0], note: 'Initial system startup',
  });

  const [openingInventoryValue, setOpeningInventoryValue] = useState(0);
  const [openingInventoryCount, setOpeningInventoryCount] = useState(0);

  const handleInventoryValueAdded = (value, count = 0) => {
    setOpeningInventoryValue((v) => v + value);
    setOpeningInventoryCount((c) => c + count);
  };

  const [assets, setAssets] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payables, setPayables] = useState([]);
  const [ownerCapital, setOwnerCapital] = useState('');
  const [ownerCapitalTouched, setOwnerCapitalTouched] = useState(false);

  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [editingLoanIndex, setEditingLoanIndex] = useState(null);


  const preEquityTotals = useMemo(() => {
    const cashBank = (Number(cash.cashAmount) || 0) + (Number(cash.bankAmount) || 0);
    const invVal = openingInventoryValue;
    const assetVal = assets.reduce((s, a) => s + (Number(a.purchaseCost) || 0), 0);
    const loanVal = loans.reduce((s, l) => s + (Number(l.principalAmount) || 0), 0);
    const payableVal = payables.reduce((s, p) => s + (Number(p.amount) || 0), 0);
   

    const totalAssets = cashBank + invVal + assetVal;
    const totalLiabilities = loanVal + payableVal;
    const suggestedOwnerCapital = totalAssets - totalLiabilities;

    return { cashBank, invVal, assetVal, loanVal, payableVal, totalAssets, totalLiabilities, suggestedOwnerCapital };
  }, [cash, openingInventoryValue, assets, loans, payables]);

  useEffect(() => {
    if (!ownerCapitalTouched) {
      setOwnerCapital(preEquityTotals.suggestedOwnerCapital.toFixed(2));
    }
  }, [preEquityTotals.suggestedOwnerCapital, ownerCapitalTouched]);

  const totals = useMemo(() => {
    const totalEquity = Number(ownerCapital) || 0;
    const difference = preEquityTotals.totalAssets - (preEquityTotals.totalLiabilities + totalEquity);
    return { ...preEquityTotals, totalEquity, difference, isBalanced: Math.abs(difference) < 1 };
  }, [preEquityTotals, ownerCapital]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await dispatch(setInitialBalance({
        cashAmount: cash.cashAmount, bankAmount: cash.bankAmount,
        ownerCapital, 
        asOfDate: cash.asOfDate, note: cash.note,
        // NOTE: no inventoryItems here — those were already created via OpeningInventoryStep
        assets, loans, payables,
      })).unwrap();
      setIsSuccess(true);
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Something went wrong establishing the baseline.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLoan = (loanData) => {
    if (editingLoanIndex !== null) {
      setLoans((prev) => prev.map((l, i) => (i === editingLoanIndex ? loanData : l)));
    } else {
      setLoans((prev) => [...prev, loanData]);
    }
    setLoanModalOpen(false);
    setEditingLoanIndex(null);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full p-16 text-center shadow-2xl rounded-[3rem] border-none bg-white">
          <div className="mx-auto w-32 h-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center text-emerald-500 mb-8">
            <PartyPopper size={64} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Accounting Active!</h2>
          <p className="text-slate-500 font-medium mt-4 leading-relaxed px-10">
            Opening position of <span className="text-slate-900 font-black">LKR {totals.totalAssets.toLocaleString()}</span> across cash, inventory, and assets has been recorded — with{' '}
            <span className="text-slate-900 font-black">{openingInventoryCount}</span> inventory items,{' '}
            <span className="text-slate-900 font-black">{assets.length}</span> assets,{' '}
            <span className="text-slate-900 font-black">{loans.length}</span> loans, and{' '}
            <span className="text-slate-900 font-black">{payables.length}</span> pending bills locked in.
          </p>
          <Button variant="primary" size="lg" fullWidth className="h-16 rounded-2xl font-black text-sm uppercase tracking-[0.2em] mt-12" onClick={() => navigate('/finance')}>
            Go to Overview <ArrowRight size={20} className="ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* STEP INDICATOR */}
      <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
              i === step ? 'bg-indigo-600 text-white' : i < step ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {i < step ? <CheckCircle2 size={12} /> : <span>{i + 1}</span>} {label}
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-200" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Card className="p-10 border-slate-100 shadow-xl rounded-[2.5rem] bg-white">

            {/* STEP 0 - Cash & Bank */}
            {step === 0 && (
              <div className="space-y-8">
                <SectionHeader icon={<Banknote />} title="Cash & Bank" color="text-emerald-600" bgColor="bg-emerald-50" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextField label="Cash in Hand (LKR)" type="number" value={cash.cashAmount} onChange={(v) => setCash({ ...cash, cashAmount: v })} />
                  <TextField label="Bank Balance (LKR)" type="number" value={cash.bankAmount} onChange={(v) => setCash({ ...cash, bankAmount: v })} />
                  <TextField label="Opening Date" type="date" value={cash.asOfDate} onChange={(v) => setCash({ ...cash, asOfDate: v })} />
                  <TextField label="Reference Note" value={cash.note} onChange={(v) => setCash({ ...cash, note: v })} />
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Cash and bank feed directly into your Cash Flow statement. Accounts Receivable is derived automatically from unpaid orders, so it isn't entered here.
                </p>
              </div>
            )}

            {/* STEP 1 - Inventory (Bulk Upload / USDA flow, reused as-is) */}
            {step === 1 && (
              <div className="space-y-6">
                <SectionHeader icon={<Package />} title="Opening Inventory" color="text-indigo-600" bgColor="bg-indigo-50" />
                <OpeningInventoryStep addedCount={openingInventoryCount} onValueAdded={handleInventoryValueAdded} />
              </div>
            )}

            {/* STEP 2 - Assets */}
            {step === 2 && (
              <div className="space-y-6">
                <SectionHeader icon={<Truck />} title="Fixed Assets" color="text-indigo-600" bgColor="bg-indigo-50" />
                <RepeatableList
                  items={assets}
                  setItems={setAssets}
                  addLabel="Add Fixed Asset"
                  emptyRow={{ name: '', assetType: 'Equipment & Tools', purchaseDate: new Date().toISOString().split('T')[0], purchaseCost: '', usefulLife: '5', depreciationMethod: 'straight-line', notes: '' }}
                  renderRow={(row, update) => (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <TextField label="Asset Name" value={row.name} onChange={(v) => update({ name: v })} />
                        <SelectField label="Asset Type" value={row.assetType} onChange={(v) => update({ assetType: v, usefulLife: v === 'Land' ? '' : row.usefulLife })} options={ASSET_TYPES} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <TextField label="Purchase Date" type="date" value={row.purchaseDate} onChange={(v) => update({ purchaseDate: v })} />
                        <TextField label="Original Cost" type="number" value={row.purchaseCost} onChange={(v) => update({ purchaseCost: v })} />
                        {row.assetType !== 'Land' && (
                          <TextField label="Useful Life (yrs)" type="number" value={row.usefulLife} onChange={(v) => update({ usefulLife: v })} />
                        )}
                      </div>
                      {row.assetType !== 'Land' && (
                        <SelectField label="Depreciation Method" value={row.depreciationMethod} onChange={(v) => update({ depreciationMethod: v })} options={['straight-line', 'declining-balance']} />
                      )}
                      <TextField label="Notes" value={row.notes} onChange={(v) => update({ notes: v })} />
                    </div>
                  )}
                />
                <p className="text-xs text-slate-400 font-medium">
                  Enter the true historical purchase date and cost — book value is derived automatically from your existing depreciation schedule.
                </p>
              </div>
            )}

            {/* STEP 3 - Loans */}
            {step === 3 && (
              <div className="space-y-6">
                <SectionHeader icon={<Landmark />} title="Loans (Short & Long-Term)" color="text-rose-600" bgColor="bg-rose-50" />

                {loans.length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium">No loans added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {loans.map((loan, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-black text-slate-900 text-sm">{loan.counterparty}</p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            LKR {Number(loan.principalAmount).toLocaleString()} · {loan.interestRate}% p.a. · {loan.durationMonths} months
                          </p>
                          <p className="text-[10px] text-indigo-600 font-bold mt-1">
                            EMI: LKR {Number(loan.monthlyInstallment).toLocaleString()}/mo
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingLoanIndex(idx); setLoanModalOpen(true); }}
                            className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 px-3 py-1.5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setLoans((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-2 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setEditingLoanIndex(null); setLoanModalOpen(true); }}
                  className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={14} /> Add Loan
                </button>

                <p className="text-xs text-slate-400 font-medium">
                  For a loan already partway repaid, enter the current remaining balance — not the original amount. The monthly installment is calculated automatically but can be overridden.
                </p>
              </div>
            )}

            {/* STEP 4 - Payables */}
            {step === 4 && (
              <div className="space-y-6">
                <SectionHeader icon={<Receipt />} title="Outstanding Bills (Accounts Payable)" color="text-amber-600" bgColor="bg-amber-50" />
                <RepeatableList
                  items={payables}
                  setItems={setPayables}
                  addLabel="Add Outstanding Bill"
                  emptyRow={{ supplier: '', description: '', amount: '', dueDate: '' }}
                  renderRow={(row, update) => (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <TextField label="Supplier / Payee" value={row.supplier} onChange={(v) => update({ supplier: v })} />
                        <TextField label="Amount Owed" type="number" value={row.amount} onChange={(v) => update({ amount: v })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <TextField label="Description" value={row.description} onChange={(v) => update({ description: v })} />
                        <TextField label="Due Date" type="date" value={row.dueDate} onChange={(v) => update({ dueDate: v })} />
                      </div>
                    </div>
                  )}
                />
                <p className="text-xs text-slate-400 font-medium">
                  These stay pending — no cash moves until you mark them paid from the Accounts Payable page later.
                </p>
              </div>
            )}

            {/* STEP 5 - Owner's Capital (auto-balanced, editable) */}
            {step === 5 && (
              <div className="space-y-6">
                <SectionHeader icon={<UserCircle />} title="Owner's Capital" color="text-amber-600" bgColor="bg-amber-50" />
                <p className="text-sm text-slate-500 font-medium">
                  This is the plug that balances your books: <span className="font-black text-slate-700">Assets − Liabilities</span>,
                  based on everything entered in the previous steps. It's pre-filled for you but fully editable.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assets</p>
                    <p className="text-lg font-black text-slate-900 mt-1">LKR {totals.totalAssets.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liabilities</p>
                    <p className="text-lg font-black text-slate-900 mt-1">LKR {totals.totalLiabilities.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel>Owner's Capital (LKR)</FieldLabel>
                    {ownerCapitalTouched && (
                      <button
                        onClick={() => setOwnerCapitalTouched(false)}
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700"
                      >
                        <RotateCcw size={11} /> Reset to Suggested
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    value={ownerCapital}
                    onChange={(e) => { setOwnerCapital(e.target.value); setOwnerCapitalTouched(true); }}
                    className="w-full h-14 px-4 rounded-xl border-2 border-amber-200 font-black text-lg bg-amber-50/40"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-2">
                    Suggested (auto-balancing) value: LKR {preEquityTotals.suggestedOwnerCapital.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* STEP 6 - Review */}
            {step === 6 && (
              <div className="space-y-6">
                <SectionHeader icon={<Calculator />} title="Review & Commit" color="text-slate-700" bgColor="bg-slate-100" />
                <div className="grid grid-cols-2 gap-4">
                  <ReviewLine label="Cash + Bank" value={totals.cashBank} />
                  <ReviewLine label="Owner's Capital" value={totals.totalEquity} />
                  <ReviewLine label="Inventory Value" value={totals.invVal} sub={`${openingInventoryCount} items`} />
                  <ReviewLine label="Fixed Assets" value={totals.assetVal} sub={`${assets.length} assets`} />
                  <ReviewLine label="Loans" value={totals.loanVal} sub={`${loans.length} loans`} />
                  <ReviewLine label="Outstanding Bills" value={totals.payableVal} sub={`${payables.length} bills`} />
                </div>
                <Button
                  fullWidth variant="primary" size="lg"
                  className="h-16 rounded-2xl font-black text-sm uppercase tracking-[0.2em] mt-4"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Committing…' : 'Confirm & Start Accounting'} <ArrowRight size={20} className="ml-2" />
                </Button>
              </div>
            )}

            {/* NAV */}
            <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-2xl h-12 px-6 font-black uppercase text-xs">
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              {step < STEPS.length - 1 && (
                <Button variant="primary" onClick={() => setStep((s) => s + 1)} className="rounded-2xl h-12 px-8 font-black uppercase text-xs">
                  Next <ArrowRight size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* SIDEBAR SUMMARY */}
        <div className="space-y-6">
          <div className="sticky top-10 space-y-6">
            <SummaryCard title="Total Assets" amount={totals.totalAssets} color="bg-emerald-600" />
            <SummaryCard title="Total Liabilities" amount={totals.totalLiabilities} color="bg-rose-600" />
            <SummaryCard title="Owner's Capital" amount={totals.totalEquity} color="bg-amber-600" />
            <div className={`p-8 rounded-[2.5rem] border-2 shadow-lg ${totals.isBalanced ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Calculator size={22} className={totals.isBalanced ? 'text-emerald-600' : 'text-rose-600'} />
                <h5 className={`text-xs font-black uppercase tracking-widest ${totals.isBalanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {totals.isBalanced ? 'Audit Balanced' : 'Audit Difference'}
                </h5>
              </div>
              <div className="flex items-center justify-between font-black text-sm">
                <span className="text-slate-400">Difference:</span>
                <span className={totals.isBalanced ? 'text-emerald-600' : 'text-rose-600'}>
                  LKR {totals.difference.toLocaleString()}
                </span>
              </div>
              {!totals.isBalanced && (
                <p className="text-[10px] text-slate-500 font-medium mt-3">
                  You've overridden Owner's Capital away from the auto-balancing value on the last step.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <LoanModal
        isOpen={loanModalOpen}
        initialData={editingLoanIndex !== null ? loans[editingLoanIndex] : null}
        onClose={() => { setLoanModalOpen(false); setEditingLoanIndex(null); }}
        onSave={handleSaveLoan}
      />
    </div>
  );
};

const SectionHeader = ({ icon, title, color, bgColor }) => (
  <div className="flex items-center gap-4 mb-2">
    <div className={`p-3 ${bgColor} ${color} rounded-2xl shadow-sm`}>{icon}</div>
    <h3 className={`font-black uppercase text-xs tracking-[0.2em] ${color}`}>{title}</h3>
  </div>
);

const ReviewLine = ({ label, value, sub }) => (
  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-lg font-black text-slate-900 mt-1">LKR {value.toLocaleString()}</p>
    {sub && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{sub}</p>}
  </div>
);

const SummaryCard = ({ title, amount, color }) => (
  <Card className={`${color} border-none p-8 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden`}>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{title}</p>
    <h4 className="text-2xl font-black tracking-tighter">LKR {amount.toLocaleString()}</h4>
  </Card>
);

export default OpeningBalanceWizard;