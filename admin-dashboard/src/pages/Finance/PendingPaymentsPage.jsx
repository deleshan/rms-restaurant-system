import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, Clock, CheckCircle2, Package, Landmark, X } from 'lucide-react';
import { fetchPendingPayments, payBill } from '@/features/finance/financeThunks';
import { clearPayablesStatus } from '@/features/finance/payablesSlice';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/common/DataTable';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Bank_Transfer', label: 'Bank Transfer' },
  { value: 'Card', label: 'Card' },
];

const PayModal = ({ bill, onClose }) => {
  const dispatch = useDispatch();
  const [method, setMethod] = useState(bill.defaultPaymentMethod || 'Bank_Transfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handlePay = async () => {
    setSaving(true);
    await dispatch(payBill({ id: bill._id, paymentMethod: method, paidDate: date }));
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Settle Bill</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="text-slate-400" /></button>
        </div>
        <p className="text-sm font-bold text-slate-500 mb-1">{bill.description}</p>
        <p className="text-2xl font-black text-slate-900 mb-6">LKR {bill.amount.toLocaleString()}</p>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Paid Via</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold">
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Payment Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-slate-200 font-bold" />
          </div>
        </div>

        <Button variant="primary" fullWidth disabled={saving} onClick={handlePay}
          className="rounded-2xl h-14 font-black uppercase text-xs mt-8">
          {saving ? 'Processing…' : 'Confirm Payment'}
        </Button>
      </div>
    </div>
  );
};

const PendingPaymentsPage = () => {
  const dispatch = useDispatch();
  const { bills, totalOwed, overdueTotal, byCategory, loading, successMessage, error } = useSelector(s => s.payables);
  const [payTarget, setPayTarget] = useState(null);

  useEffect(() => { dispatch(fetchPendingPayments()); }, [dispatch]);

  const columns = [
    {
      key: 'description', label: 'Bill',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900">{row.description}</div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{row.supplier}</div>
        </div>
      ),
    },
    {
      key: 'category', label: 'Type',
      render: (row) => (
        <Badge variant="outline" className="font-bold flex items-center gap-1 w-fit">
          {row.category === 'ASSET_PURCHASE' ? <Landmark size={12}/> : <Package size={12}/>}
          {row.category === 'ASSET_PURCHASE' ? 'Asset' : 'Inventory'}
        </Badge>
      ),
    },
    { key: 'amount', label: 'Amount', render: (row) => <span className="font-black">LKR {row.amount.toLocaleString()}</span> },
    {
      key: 'dueDate', label: 'Due',
      render: (row) => row.dueDate ? (
        <span className={row.isOverdue ? 'text-rose-600 font-black' : 'text-slate-500 font-bold'}>
          {new Date(row.dueDate).toLocaleDateString()} {row.isOverdue && '(Overdue)'}
        </span>
      ) : <span className="text-slate-300">—</span>,
    },
    {
      key: 'actions', label: '',
      render: (row) => (
        <Button variant="success" onClick={() => setPayTarget(row)} className="h-9 px-4 rounded-xl text-xs font-black uppercase">
          Mark Paid
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-8">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Accounts Payable</h1>
        <p className="text-slate-500 font-medium italic">Outstanding bills from inventory & asset purchases.</p>
      </div>

      {(error || successMessage) && (
        <div className={`p-5 rounded-2xl flex items-center justify-between ${error ? 'bg-rose-50 text-rose-900' : 'bg-emerald-50 text-emerald-900'}`}>
          <div className="flex items-center gap-3">
            {error ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}
            <span className="font-bold text-sm">{error || successMessage}</span>
          </div>
          <button onClick={() => dispatch(clearPayablesStatus())}><X size={18}/></button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="p-6"><p className="text-[10px] font-black text-slate-400 uppercase">Total Owed</p><p className="text-2xl font-black">LKR {totalOwed.toLocaleString()}</p></Card>
        <Card className="p-6"><p className="text-[10px] font-black text-rose-400 uppercase">Overdue</p><p className="text-2xl font-black text-rose-600">LKR {overdueTotal.toLocaleString()}</p></Card>
        <Card className="p-6"><p className="text-[10px] font-black text-indigo-400 uppercase">Inventory Bills</p><p className="text-2xl font-black">LKR {byCategory.inventory.toLocaleString()}</p></Card>
        <Card className="p-6"><p className="text-[10px] font-black text-amber-400 uppercase">Asset Bills</p><p className="text-2xl font-black">LKR {byCategory.assets.toLocaleString()}</p></Card>
      </div>

      <Card className="p-8">
        <DataTable columns={columns} data={bills} loading={loading} emptyMessage="No outstanding bills. You're all settled up." />
      </Card>

      {payTarget && <PayModal bill={payTarget} onClose={() => setPayTarget(null)} />}
    </div>
  );
};

export default PendingPaymentsPage;