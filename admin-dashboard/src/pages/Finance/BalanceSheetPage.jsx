import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBalanceSheet, exportFinanceReport } from '@/features/finance/financeThunks';
import {
  selectBalanceSheet,
  selectFinanceLoading,
  selectFinanceError,
} from '@/features/finance/financeSelector';
import { Link } from 'react-router-dom';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import Chart from '@/components/ui/Chart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  AlertCircle, 
  CheckCircle2,
  FileText
} from 'lucide-react';

const BalanceSheetPage = ({settings}) => {
  const dispatch = useDispatch();

  // Redux State
  const balanceSheet = useSelector(selectBalanceSheet) || {};
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);

  // Filter State
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  //  Fundamental Accounting Check: Assets = Liabilities + Equity
  const isBalanced = useMemo(() => {
    const assets = balanceSheet.totalAssets || 0;
    const lAndE = (balanceSheet.totalLiabilities || 0) + (balanceSheet.totalEquity || 0);
    
    return Math.abs(assets - lAndE) < 1;
  }, [balanceSheet]);

  useEffect(() => {
    const params = dateRange === 'custom' ? { startDate, endDate } : { period: dateRange };
    dispatch(fetchBalanceSheet(params));
  }, [dispatch, dateRange, startDate, endDate]);

  //  Chart Configuration
  const balanceChartData = {
    labels: ['Total Assets', 'Liabilities + Equity'],
    datasets: [
      {
        label: 'Value (LKR)',
        data: [
          balanceSheet?.totalAssets || 0,
          (balanceSheet?.totalLiabilities || 0) + (balanceSheet?.totalEquity || 0),
        ],
        backgroundColor: ['#6366f1', '#10b981'],
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: false } },
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">
              <Link to="/finance" className="hover:text-indigo-600 transition-colors">Finance</Link>
              <span className="opacity-30">/</span>
              <span className="text-slate-600">Balance Sheet</span>
            </div>
      {/*  HEADER  */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Balance Sheet</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest opacity-70">Financial Position Report</p>
              {isBalanced ? (
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50 font-black text-[10px] px-3 py-1 uppercase tracking-tighter">
                  <CheckCircle2 size={12} className="mr-1" /> Balanced
                </Badge>
              ) : (
                <Badge variant="danger" className="bg-rose-500/10 text-rose-600 border-rose-200/50 font-black text-[10px] px-3 py-1 uppercase tracking-tighter">
                  <AlertCircle size={12} className="mr-1" /> Unbalanced
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" leftIcon={<Download size={18} />} className="shadow-indigo-200 shadow-xl font-bold" onClick={() => dispatch(exportFinanceReport({ reportType: 'balance-sheet', format: 'pdf', filters: {} }))}>
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/*  FILTER BAR  */}
      <div className="bg-white/50 backdrop-blur-xl border border-white p-5 rounded-[2rem] shadow-lg overflow-visible relative z-50">
        <div className="flex flex-wrap gap-4 items-end ">
          <div className="w-48 overflow-visible">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Period</label>
            <Select
              className="bg-white/60 border-white/80 rounded-2xl font-bold text-slate-700"
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'lastMonth', label: 'Last Month' },
                { value: 'thisYear', label: 'This Year' },
                { value: 'custom', label: 'Custom Range' },
              ]}
            />
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-3 items-center animate-in slide-in-from-left-2">
              <Input type="date" className="bg-white/60 border-white rounded-2xl font-bold" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-slate-400 font-black text-[10px] uppercase">to</span>
              <Input type="date" className="bg-white/60 border-white rounded-2xl font-bold" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Reconciling accounts..." />
      ) : (
        <>
          {/* KPI SUMMARY  */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Assets" value={balanceSheet.totalAssets} color="indigo" settings={settings.currency}/>
            <KPICard title="Total Liabilities" value={balanceSheet.totalLiabilities} color="rose" settings={settings.currency} />
            <KPICard title="Net Equity" value={balanceSheet.totalEquity} color="emerald" settings={settings.currency}/>
            <KPICard 
              title="Current Ratio" 
              value={(balanceSheet.currentAssets / balanceSheet.currentLiabilities).toFixed(2)} 
              isCurrency={false} 
              color="amber"
              subtitle="Liquidity Health"
            />
          </div>

          {/* DETAILED STATEMENT GRID  */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ASSETS COLUMN */}
            <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-8">
                <div className="w-2 h-6 bg-indigo-500 rounded-full" /> Assets
              </h2>
              <div className="space-y-5">
                <SectionHeader title="Current Assets" />
                <LineItem label="Cash & Bank" value={balanceSheet.cash} settings={settings.currency}/>
                <LineItem label="Accounts Receivable" value={balanceSheet.receivables} settings={settings.currency} />
                <LineItem label="Inventory" value={balanceSheet.inventory} settings={settings.currency}/>
                
                <SectionHeader title="Fixed Assets" className="pt-6" />
                <LineItem label="Property & Equipment" value={balanceSheet.fixedAssets} settings={settings.currency}/>
                <LineItem label="Less: Depreciation" value={balanceSheet.depreciation} isNegative settings={settings.currency}/>
                
                <SectionHeader title="Other Assets" className="pt-6" />
                <LineItem label="External Investments Placed" value={balanceSheet.externalInvestments} settings={settings.currency}/>

                <div className="mt-10 p-6 bg-indigo-500/5 border border-indigo-100/50 rounded-3xl flex justify-between items-center shadow-inner">
                  <span className="font-black text-indigo-900 text-sm uppercase tracking-wider">Total Assets</span>
                  <span className="text-2xl font-black text-indigo-600 tracking-tighter">
                    {settings.currency} {(balanceSheet.totalAssets || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* LIABILITIES & EQUITY COLUMN */}
            <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-8">
                <div className="w-2 h-6 bg-emerald-500 rounded-full" /> Liabilities & Equity
              </h2>
              <div className="space-y-5">
                <SectionHeader title="Current Liabilities" />
                <LineItem label="Accounts Payable" value={balanceSheet.payables} settings={settings.currency}/>
                <LineItem label="Short-term Debt" value={balanceSheet.shortTermDebt} settings={settings.currency}/>
                
                <SectionHeader title="Long-term Liabilities" className="pt-6" />
                <LineItem label="Long-term Loans" value={balanceSheet.longTermDebt} settings={settings.currency}/>
                
                <SectionHeader title="Equity" className="pt-6" />
                <LineItem label="Owner's Capital" value={balanceSheet.ownersCapital} settings={settings.currency}/>
                <LineItem label="Retained Earnings" value={balanceSheet.retainedEarnings} settings={settings.currency}/>
                
                <div className="mt-10 p-6 bg-emerald-500/5 border border-emerald-100/50 rounded-3xl flex justify-between items-center shadow-inner">
                  <span className="font-black text-emerald-900 text-sm uppercase tracking-wider">Total L & E</span>
                  <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                    {settings.currency} {((balanceSheet.totalLiabilities || 0) + (balanceSheet.totalEquity || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STRUCTURAL CHART  */}
          <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 overflow-visible min-h-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 text-center">
              Balance Structure Comparison
            </h3>
            
            {/* The Relative Wrapper is the Secret Sauce */}
            <div className="relative h-auto w-full px-4"> 
              <Chart 
                type="bar" 
                data={balanceChartData} 
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  responsive: true,
                }} 
              />
            </div>

            <p className="text-[9px] text-center text-slate-400 font-black mt-10 uppercase tracking-[0.15em] opacity-60">
              * Fundamental Accounting Equation: Assets = Liabilities + Equity
            </p>
          </div>
        </>
      )}
    </div>
  );
};

//  Sub-Components

const KPICard = ({ title, value, color, isCurrency = true, subtitle, settings }) => {
  const themes = {
    indigo: 'shadow-indigo-100/30 border-t-indigo-500',
    rose: 'shadow-rose-100/30 border-t-rose-500',
    emerald: 'shadow-emerald-100/30 border-t-emerald-500',
    amber: 'shadow-amber-100/30 border-t-amber-500',
  };

  return (
    <div className={`bg-white/70 backdrop-blur-xl border border-white border-t-4 p-6 rounded-[2rem] shadow-xl transition-transform hover:scale-[1.02] ${themes[color]}`}>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      <p className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">
        {isCurrency ? `${settings} ${(value || 0).toLocaleString()}` : value}
      </p>
      {subtitle && <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{subtitle}</p>}
    </div>
  );
};

const SectionHeader = ({ title, className }) => (
  <h3 className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100/50 pb-2 ${className}`}>
    {title}
  </h3>
);

const LineItem = ({ label, value, isNegative = false, settings }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm font-bold text-slate-600">{label}</span>
    <span className={`font-mono text-sm font-black tracking-tighter ${isNegative ? 'text-rose-500' : 'text-slate-900'}`}>
      {isNegative ? '-' : ''} {settings} {(value || 0).toLocaleString()}
    </span>
  </div>
);

export default BalanceSheetPage;