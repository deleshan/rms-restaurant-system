import React, { useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';   
import { useDispatch, useSelector } from 'react-redux';
import {
  DollarSign,
  BarChart3,
  AlertTriangle,
  Download,
  Plus,
  Wallet,
} from 'lucide-react';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import Button from '@/components/common/Button';
import FinanceTopBar from '@/components/layout/FinanceTopBar';
import FinanceOverview from './FinanceOverview';
import SalesReport from './SalesReport';
import PnLPage from './PnLPage';
import CashflowPage from './CashFlowPage';
import AssetsPage from './AssestsPage';
import BalanceSheet from './BalanceSheetPage';
import Expenditures from './Expenditures';
import InitialBalanceSetup from './InitialBalanceSetup';
import PendingPaymentsPage from './PendingPaymentsPage';

// LAZY LOAD NEW COGNITIVE TRANSACTION CORE LAYER
const FinancialTransactionsPage = lazy(() => import('./FinancialTransactionsPage'));

import { 
  fetchFinanceOverview,
  exportFinanceReport,
  fetchPnLReport,
  fetchCashFlow,
  fetchCapitalTransactions,
  fetchPendingPayments,
 } from '@/features/finance/financeThunks';
import {
  selectFinanceOverview,
  selectFinanceLoading,
  selectFinanceError,
  selectPnLReport,
  selectPrimeCost,
  selectCashRunway,
  selectDebtToEquityRatio,
} from '@/features/finance/financeSelector';
import { selectSettingsData} from '@/features/settings/settingsSelector';

// UPDATED VALID TABS TO RECOGNIZE THE NEW INTERFACE BLOCK
const VALID_TABS = [
  'overview', 'sales', 'pnl', 'cashflow',
  'balance-sheet', 'assets', 'expenditures','payables', 'transactions', 'setup',
];

const FinancePage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();  

  // Derive active tab from URL — safe fallback to 'overview'
  const tabFromUrl = searchParams.get('tab');
  const activeTab  = VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  // Single handler — writes tab into URL
  const handleTabChange = (tab) => setSearchParams({ tab });  

  const overview = useSelector(selectFinanceOverview);
  const loading  = useSelector(selectFinanceLoading);
  const error    = useSelector(selectFinanceError);

  const pnlReport    = useSelector(selectPnLReport);
  const primeCost    = useSelector(selectPrimeCost);
  const cashRunway   = useSelector(selectCashRunway);
  const debtToEquity = useSelector(selectDebtToEquityRatio);
  const payables     = useSelector((state) => state.payables);

  const settings = useSelector(selectSettingsData);

  const isInitialized = overview?.isInitialized ?? true;

  useEffect(() => {
    dispatch(fetchFinanceOverview());
    dispatch(fetchPnLReport());
    dispatch(fetchCashFlow());
    dispatch(fetchCapitalTransactions());
    dispatch(fetchPendingPayments());
  }, [dispatch]);

  const handleExport = () => {
    dispatch(exportFinanceReport({ reportType: activeTab, format: 'pdf' }));
  };

  // UPDATED CONDITIONAL RENDERING WRAPPED IN SUSPENSE FOR CHUNKS
  const renderActiveSection = () => {
    const props = { overview, settings };
    switch (activeTab) {
      case 'overview': return <FinanceOverview {...props}
          revenueBreakdown={pnlReport?.revenueBreakdown}
          primeCost={primeCost}
          cashRunway={cashRunway}
          debtToEquity={debtToEquity}
          payables={payables} />;
      case 'sales': return <SalesReport {...props} />;
      case 'pnl': return <PnLPage {...props} />;
      case 'cashflow': return <CashflowPage {...props} />;
      case 'balance-sheet': return <BalanceSheet {...props} />;
      case 'assets': return <AssetsPage {...props} />;
      case 'expenditures': return <Expenditures {...props} />;
      case 'payables': return <PendingPaymentsPage {...props} />; 
      case 'transactions': 
        return (
          <Suspense fallback={<LoadingSpinner message="Assembling capital tracking structures..." />}>
            <FinancialTransactionsPage {...props} />
          </Suspense>
        );
      case 'setup': return <InitialBalanceSetup {...props} />;
      default: return <FinanceOverview {...props} />;
    }
  };

  if (loading && activeTab === 'overview') return (
    <div className="h-screen flex items-center justify-center">
      <LoadingSpinner message="Analyzing financial data..." />
    </div>
  );
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">

      {/* HEADER */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              Finance Control
            </h1>
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2 opacity-70">
              Real-time Health • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* INITIAL SETUP BANNER */}
      {!isInitialized && activeTab === 'overview' && (
        <div className="group relative overflow-hidden bg-indigo-600/5 backdrop-blur-xl border border-indigo-100 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:bg-indigo-600/[0.08]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 transform group-hover:rotate-6 transition-transform">
              <Wallet size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight">
                System Initialization Required
              </h3>
              <p className="text-sm text-indigo-700/80 font-medium">
                Your financial tracking is dormant. Set an opening balance to begin auditing.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => handleTabChange('setup')}
            className="rounded-xl px-8 shadow-lg shadow-indigo-200 font-bold relative z-10"
          >
            Start Setup
          </Button>
        </div>
      )}

      {/* FINANCE TAB NAVIGATION */}
      <FinanceTopBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* MAIN CONTENT */}
      <div className="min-h-[500px]">
        {renderActiveSection()}
      </div>

      {/* FOOTER RISK ALERTS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="flex items-center gap-5 p-6 bg-white/70 backdrop-blur-2xl border border-white rounded-[2rem] shadow-xl shadow-amber-100/20">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-600 border border-amber-200/50 shadow-inner">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Receivables Alert</p>
              <p className="text-xs text-slate-600 font-bold mt-1">
                Pending: <span className="text-amber-600 font-black">{settings?.currency} {(overview?.pendingPayments ?? 0).toLocaleString()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 p-6 bg-white/70 backdrop-blur-2xl border border-white rounded-[2rem] shadow-xl shadow-rose-100/20">
          <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-600 border border-rose-200/50 shadow-inner">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Payables Alert</p>
            <p className="text-xs text-slate-600 font-bold mt-1">
              Owed: <span className="text-rose-600 font-black">{settings?.currency} {payables?.totalOwed?.toLocaleString() || 0}</span>
            </p>
          </div>
        </div>
          <div className="flex items-center gap-5 p-6 bg-white/70 backdrop-blur-2xl border border-white rounded-[2rem] shadow-xl shadow-indigo-100/20">
            <div className={`p-4 rounded-2xl border shadow-inner ${
              (overview?.revenueGrowth ?? 0) >= 0
                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-200/50'
                : 'bg-rose-500/10 text-rose-600 border-rose-200/50'
            }`}>
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-wide">Growth Insight</p>
              <p className="text-xs text-slate-600 font-bold mt-1">
                Revenue {(overview?.revenueGrowth ?? 0) >= 0 ? 'trending' : 'declining'}{' '}
                <span className={`font-black ${
                  (overview?.revenueGrowth ?? 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'
                }`}>
                  {(overview?.revenueGrowth ?? 0) >= 0 ? '+' : ''}{overview?.revenueGrowth ?? 0}%
                </span>{' '}
                vs last month
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;