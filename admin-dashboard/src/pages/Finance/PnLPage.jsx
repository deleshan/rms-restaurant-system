import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPnLReport, exportFinanceReport } from '@/features/finance/financeThunks';
import {
  selectPnLReport,
  selectFinanceLoading,
  selectFinanceError,
} from '@/features/finance/financeSelector';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import Chart from '@/components/ui/Chart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';

import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  PieChart, 
  Receipt,
  FileText,
  DollarSign
} from 'lucide-react';

const PnLPage = ({settings}) => {
  const dispatch = useDispatch();
  const currency = settings?.currency;
  // Redux State
  const pnl = useSelector(selectPnLReport) || {};
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);

  // Filter State
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (dateRange === 'custom' && (!startDate || !endDate)) return; // wait for both dates
    const params = dateRange === 'custom' ? { startDate, endDate } : { period: dateRange };
    dispatch(fetchPnLReport(params));
  }, [dispatch, dateRange, startDate, endDate]);

  // Chart Configuration: Revenue vs Profit vs Expenses
  const monthlyPnLChart = useMemo(() => ({
    labels: pnl?.monthly?.map(m => m.month) || ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [
      {
        label: 'Revenue',
        data: pnl?.monthly?.map(m => m.revenue) || [],
        backgroundColor: '#6366f1', 
        borderRadius: 4,
      },
      {
        label: 'Expenses',
        data: pnl?.monthly?.map(m => m.totalExpenses) || [],
        backgroundColor: '#f43f5e', 
        borderRadius: 4,
      },
      {
        label: 'Net Profit',
        data: pnl?.monthly?.map(m => m.netProfit) || [],
        backgroundColor: '#10b981', 
        borderRadius: 4,
      },
    ],
  }), [pnl]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Profit & Loss Statement</h1>
          <p className="text-gray-500 text-sm mt-1 italic">Summary of revenue, costs, and expenses incurred during a specific period.</p>
        </div>
        <div className="flex gap-2">
          
          <Button variant="primary" leftIcon={<Download size={18}  />} onClick={() => dispatch(exportFinanceReport({
            reportType: 'pnl',
            format: 'pdf',
            filters: dateRange === 'custom' ? { startDate, endDate } : { period: dateRange },}))}
            >
              Export Report
          </Button>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <Card className="p-4 bg-gray-50/50 border-none shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-48">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Timeframe</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="today">Today</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
              <input type="date" className="text-sm rounded border-gray-200 px-2 py-1.5 focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <span className="text-gray-300">to</span>
              <input type="date" className="text-sm rounded border-gray-200 px-2 py-1.5 focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Reconciling accounts..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* Top Level KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PnLKPI 
              title="Total Revenue" 
              value={pnl?.totalRevenue} 
              growth={pnl?.revenueGrowth} 
              icon={<TrendingUp size={18} />}
              color="indigo"
              currency= {currency}
            />
            <PnLKPI 
              title="Gross Profit" 
              value={pnl?.grossProfit} 
              icon={<Receipt size={18} />}
              color="amber"
              currency= {currency}
            />
            <PnLKPI 
              title="Op. Expenses" 
              value={pnl?.totalExpenses} 
              subtitle={`${((pnl?.totalExpenses / pnl?.totalRevenue) * 100 || 0).toFixed(1)}% of Revenue`}
              icon={<PieChart size={18} />}
              color="rose"
              currency= {currency}
            />
            <PnLKPI 
              title="Total Net Profit" 
              value={pnl?.totalNetProfit} 
              growth={pnl?.totalNetProfitGrowth} 
              icon={<DollarSign size={18} />}
              color="emerald"
              currency= {currency}
            />
          </div>

          {/* Performance Chart */}
          <Card title="Revenue vs Expenses Trend" className="p-6">
            
            <div className="h-80 mt-4">
              <Chart 
                type="bar" 
                data={monthlyPnLChart} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: { x: { grid: { display: false } } }
                }} 
              />
            </div>
          </Card>

          {/* Detailed Statement Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Gross Profit */}
            <Card className="overflow-hidden border-none shadow-sm">
              <div className="bg-indigo-900 px-4 py-3 text-white">
                <h3 className="font-bold uppercase text-[10px] tracking-widest opacity-80">Income Statement</h3>
              </div>
              <div className="p-4 space-y-3">
                <LineItem label="Main Course" value={pnl?.revenueBreakdown?.mainCourse} currency= {currency} />
                <LineItem label="Appetizers" value={pnl?.revenueBreakdown?.appetizers} currency= {currency} />
                <LineItem label="Beverages" value={pnl?.revenueBreakdown?.beverages} currency= {currency} />
                <LineItem label="Bread" value={pnl?.revenueBreakdown?.bread} currency= {currency} />
                <LineItem label="Other Foods" value={pnl?.revenueBreakdown?.otherFood} currency= {currency} />

                <div className="pt-2 border-t mt-4 flex justify-between font-bold text-indigo-700 bg-indigo-50/50 p-2 rounded">
                  <span>Total Revenue from Sales</span>
                  <span className="font-mono">{currency} {(pnl?.totalRevenue || 0).toLocaleString()}</span>
                </div>

                <div className="mt-6">
                  <LineItem label="Cost of Goods Sold (COGS)" value={pnl?.cogs} isNegative />
                  <div className="pt-2 border-t flex justify-between font-bold text-gray-900 mt-2 p-2">
                    <span>Gross Profit from Sales</span>
                    <span className="font-mono text-lg">{currency} {(pnl?.grossProfit || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Operating Expenses & Net Profit */}
            <Card className="overflow-hidden border-none shadow-sm">
              <div className="bg-rose-900 px-4 py-3 text-white">
                <h3 className="font-bold uppercase text-[10px] tracking-widest opacity-80">Operating Expenses</h3>
              </div>
              <div className="p-4 space-y-3">
                <LineItem label="Staff Salaries" value={pnl?.expensesStaff} currency= {currency}/>
                <LineItem label="Rent & Occupancy" value={pnl?.expensesUtilities} currency= {currency} />
                <LineItem label="Marketing & Ad" value={pnl?.expensesMarketing} currency= {currency} />
                <LineItem label="Maintenance" value={pnl?.expensesMaintenance} currency= {currency} />
                <LineItem label="Interest on Loans" value={pnl?.interestExpense} currency= {currency} />
                <LineItem label="Depreciation" value={pnl?.depreciationExpense} currency= {currency} />
                <LineItem label="Other Expenses" value={pnl?.otherExpenses} currency= {currency} />

                <div className="pt-2 border-t mt-4 flex justify-between font-bold text-rose-700 bg-rose-50/50 p-2 rounded">
                  <span>Total Expenses</span>
                  <span className="font-mono">{currency} {(pnl?.totalExpenses || 0).toLocaleString()}</span>
                </div>

                <div className="mt-4 p-4 bg-gray-900 rounded-xl text-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] opacity-80 font-bold uppercase tracking-tight">Net Profit</p>
                    <p className="text-xl font-black font-mono">{currency} {(pnl?.netProfit || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-80 font-bold uppercase tracking-tight">Margin</p>
                    <p className="text-lg font-bold">{(pnl?.margin || 0).toFixed(1)}%</p>
                  </div>
                </div>

                <LineItem label="Other Profits (Asset Sales)" value={pnl?.otherProfits} className="mt-4" />

                <div className="mt-2 p-4 bg-emerald-600 rounded-xl text-white flex justify-between items-center shadow-lg shadow-emerald-100">
                  <div>
                    <p className="text-[10px] opacity-80 font-bold uppercase tracking-tight">Total Net Profit</p>
                    <p className="text-2xl font-black font-mono">{currency} {(pnl?.totalNetProfit || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// Local Helpers

const PnLKPI = ({ title, value, growth, subtitle, icon, color, currency }) => {
  const colorMap = {
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    rose: 'text-rose-600 bg-rose-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  return (
    <Card hoverable className="group border-none shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono">
            {currency} {(value || 0).toLocaleString()}
          </p>
          {subtitle && <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      {growth !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          <Badge variant={growth >= 0 ? 'success' : 'danger'}>
            {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(growth)}%
          </Badge>
          <span className="text-[10px] text-gray-400 font-medium">vs prev.</span>
        </div>
      )}
    </Card>
  );
};

const LineItem = ({ label, value, isNegative, className = "", currency }) => (
  <div className={`flex justify-between text-sm py-1 border-b border-gray-50 last:border-0 ${className}`}>
    <span className="text-gray-500">{label}</span>
    <span className={`font-mono font-medium ${isNegative ? 'text-rose-500' : 'text-gray-700'}`}>
      {isNegative ? '-' : ''}{currency} {(value || 0).toLocaleString()}
    </span>
  </div>
);

export default PnLPage;