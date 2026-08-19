import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCapitalTransactions,
  createCapitalTransaction,
  exportFinanceReport,
  fetchActiveLoans,
} from '@/features/finance/financeThunks';
import {
  selectCapitalTransactions,
  selectCapitalTotals,
  selectFinanceLoading,
  selectFinanceError,
  selectActiveLoans
} from '@/features/finance/financeSelector';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  HandCoins, 
  Download, 
  Plus, 
  Filter, 
  Briefcase, 
  Building2, 
  MoveRight, 
  MoveLeft 
} from 'lucide-react';

// Importing your custom UI/UX component library
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import ConfirmModal from '@/components/common/ConfirmModal';
import Input from '@/components/ui/Input';
import { toast } from '@/components/common/Toast';

// Contextual inner sub-view modal component
import TransactionModal from './ManageTransactionModal'; 


const FinancialTransactionsPage = ({settings}) => {
  const dispatch = useDispatch();

  // Component Core States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Confirmation Modal State for high-risk modifications (Drawings/External Investments)
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, data: null });

  // Redux Integrations
  const transactions = useSelector(selectCapitalTransactions);
  const totals = useSelector(selectCapitalTotals);
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);
  const activeLoans = useSelector(selectActiveLoans);

  // Trigger dispatch cycle upon filter mutation
  useEffect(() => {
    if (dateRange !== 'custom' || (startDate && endDate)) {
      const params = dateRange === 'custom'
        ? { startDate, endDate }
        : { period: dateRange };
    dispatch(fetchCapitalTransactions(params));
    dispatch(fetchActiveLoans());
    }
  }, [dispatch, dateRange, startDate, endDate]);

  // Handle the confirmation execution for high-value operations
  const handleExecuteTransaction = () => {
    const { data } = confirmConfig;
    dispatch(createCapitalTransaction(data))
      .unwrap()
      .then(() => {
        toast.success(`${data.type.replace('_', ' ')} recorded successfully! Ledger profiles updated.`);
        setIsModalOpen(false);
        setConfirmConfig({ isOpen: false, data: null });
        dispatch(fetchActiveLoans());
      })
      .catch((err) => {
        toast.error(err || "Failed to finalize ledger distribution transaction.");
        setConfirmConfig({ isOpen: false, data: null });
      });
  };

  // Dynamic Column Mapping to feed into your custom DataTable
  const columns = useMemo(() => [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'type',
      label: 'Transaction Type',
      render: (row) => {
        const typeVariants = {
          Loan_Disbursement: { variant: 'success', label: 'Loan Inflow', icon: <Building2 size={12} /> },
          Loan_Repayment: { variant: 'danger', label: 'Loan Payment', icon: <Building2 size={12} /> },
          Investment_In: { variant: 'success', label: 'Capital Invested In', icon: <MoveLeft size={12} /> },
          Investment_Out: { variant: 'warning', label: 'Placed Capital Out', icon: <MoveRight size={12} /> },
          Owner_Investment: { variant: 'success', label: 'Owner Equity In', icon: <Briefcase size={12} /> },
          Owner_Drawing: { variant: 'danger', label: 'Owner Drawing', icon: <HandCoins size={12} /> },
          Opening_Loan: { variant: 'outline', label: 'Opening Loan Balance', icon: <Building2 size={12} /> },
          Opening_Capital: { variant: 'outline', label: 'Opening Capital Balance', icon: <Briefcase size={12} /> },
        };
        const target = typeVariants[row.type] || { variant: 'outline', label: row.type, icon: null };
        return (
          <Badge variant={target.variant} className="flex items-center gap-1.5 w-fit font-semibold uppercase tracking-wider text-[10px]">
            {target.icon}
            {target.label}
          </Badge>
        );
      }
    },
    { key: 'sourceOrDestination', label: 'Counterparty / Entity', sortable: true },
    { key: 'paymentMethod', label: 'Method' },
    {
      key: 'amount',
      label: `Amount (${settings?.currency})`,
      sortable: true,
      render: (row) => {
        const isOutflow = ['Loan_Repayment', 'Investment_Out', 'Owner_Drawing'].includes(row.type);
        return (
          <span className={`font-mono font-bold ${isOutflow ? 'text-rose-500' : 'text-emerald-500'}`}>
            {isOutflow ? '-' : '+'} {settings?.currency} {row.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
  ], []);

  // Filter local rows on matching structural properties to avoid hitting endpoints on tab switch
  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return transactions;
    if (activeTab === 'loans') {
      return transactions.filter(t => t.type.startsWith('Loan_') || t.type === 'Opening_Loan');
    }
    if (activeTab === 'investments') {
      return transactions.filter(t => t.type.includes('Investment_'));
    }
    if (activeTab === 'equity') {
      return transactions.filter(t => t.type.startsWith('Owner_') || t.type === 'Opening_Capital');
    }
    return transactions;
  }, [transactions, activeTab]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2">
      
      {/* Structural Header Layer */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial Transactions
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage enterprise debts, strategic long-term investments, and stakeholder equity allocations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Download size={18} />}
            onClick={() => dispatch(exportFinanceReport({
              reportType: 'transactions',
              format: 'pdf',
              filters: dateRange === 'custom' ? { startDate, endDate, category: activeTab } : { period: dateRange, category: activeTab },
            }))}
          >
            Export Ledger
          </Button>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            New Transaction
          </Button>
        </div>
      </div>

      {/* Global Control & Filtering Utility Card */}
      <Card variant="default" className="p-4 bg-white/40 dark:bg-slate-900/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          {/* Tab Filtering Mechanics */}
          <div className="flex gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl overflow-x-auto w-full sm:w-auto">
            {['all', 'loans', 'investments', 'equity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab === 'all' ? 'Unified Ledger' : tab}
              </button>
            ))}
          </div>

          {/* Filtering Metrics Calendar Constraints */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter size={16} className="text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-xl border-none text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-white/70 p-2.5 shadow-sm cursor-pointer focus:ring-2 focus:ring-brand"
            >
              <option value="today">Today</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {dateRange === 'custom' && (
            <div className="flex gap-2 items-center animate-in slide-in-from-left-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-gray-300">to</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>
      </Card>

      {/* Primary Infrastructure States */}
      {loading ? (
        <LoadingSpinner message="Re-calculating balances and equity allocations..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* Summary Glass Cards Array */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <Card title="Active Borrowings" description="Outstanding Bank & Third-Party Debt" icon={<Building2 className="text-rose-500" />} hoverable>
              <p className="text-2xl font-black text-rose-600 font-mono mt-1">
                {settings?.currency} {totals.activeLoans?.toLocaleString()}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                Accumulated principal liable to amortized monthly payouts.
              </div>
            </Card>

            <Card title="External Capital In" description="Platform Third-Party Injections" icon={<TrendingUp className="text-emerald-500" />} hoverable>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {settings?.currency} {totals.externalInvestmentsIn?.toLocaleString()}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                Total continuous funding inside active business parameters.
              </div>
            </Card>

            <Card title="External Capital Out" description="Allocated Outside Portfolios" icon={<TrendingDown className="text-amber-500" />} hoverable>
              <p className="text-2xl font-black text-amber-500 font-mono mt-1">
                {settings?.currency} {totals.externalInvestmentsOut?.toLocaleString()}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                Platform capital deployed outside standard restaurant structures.
              </div>
            </Card>

            <Card title="Net Owner Equity" description="Contributed Capital Less Drawings" icon={<Briefcase className="text-brand" />} hoverable>
              <p className={`text-2xl font-black font-mono mt-1 ${totals.netOwnerEquity >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                {settings?.currency} {totals.netOwnerEquity?.toLocaleString()}
              </p>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                Net remaining corporate stake held explicitly by ownership.
              </div>
            </Card>

          </div>

          {/* Unified Ledger Log Section Container */}
          <div className="grid grid-cols-1 gap-6">
            <Card 
              variant="elevated" 
              title="Execution History Logs" 
              description="Real-time balancing entry logs matching accounting standards"
              className="overflow-hidden shadow-xl"
            >
              <div className="mt-4">
                <DataTable 
                  columns={columns} 
                  data={filteredTransactions} 
                  emptyMessage={`No capital modifications tracked under context context matching [${activeTab.toUpperCase()}] constraints.`}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Dynamic Form Control Modal Module */}
      {isModalOpen && (
        <TransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          mode="capital_management"
          activeLoans={activeLoans}
          onSubmitConfirm={(formattedPayload) => setConfirmConfig({ isOpen: true, data: formattedPayload })}
        />
      )}

      {/* Security Interceptor Layer for high-value entity allocation alterations */}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, data: null })}
        onConfirm={handleExecuteTransaction}
        title="Authorize Capital Restructuring?"
        message="This operation introduces balance modifications directly impacting corporate equity accounts, operational liabilities, and short-term cash flow metrics. Please verify ledger information prior to authorization."
        variant="warning"
        confirmText="Post Transaction"
      />

      

    </div>
  );
};

export default FinancialTransactionsPage;