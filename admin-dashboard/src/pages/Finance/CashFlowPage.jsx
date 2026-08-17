import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCashFlow, exportFinanceReport } from '@/features/finance/financeThunks';
import {
  selectCashFlow,
  selectFinanceLoading,
  selectFinanceError,
} from '@/features/finance/financeSelector';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

import { Download, Wallet, TrendingUp, TrendingDown, Landmark, History } from 'lucide-react';

const CashFlowPage = ({ settings = {} }) => {
  const dispatch = useDispatch();
  const currencySymbol = settings?.currency || 'Rs.';

  // Safe Currency Formatter
  const fmt = (v) => `${currencySymbol} ${Math.abs(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const cashFlow = useSelector(selectCashFlow) || {};
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);

  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (dateRange !== 'custom' || (startDate && endDate)) {
      const params = dateRange === 'custom'
        ? { startDate, endDate }
        : { period: dateRange };
      dispatch(fetchCashFlow(params));
    }
  }, [dispatch, dateRange, startDate, endDate]);

  const op = cashFlow.operating || {};
  const inv = cashFlow.investing || {};
  const fin = cashFlow.financing || {};

  // Operating Cash Movements (Activity Only)
  const operatingLines = useMemo(() => ([
    { label: 'Collect from sales', value: op.collectFromSales, sign: '+' },
    { label: 'Payroll / salaries', value: op.payrollSalaries, sign: '-' },
    { label: 'Utilities', value: op.utilities, sign: '-' },
    { label: 'Inventory purchase', value: op.inventoryPurchase, sign: '-' },
    { label: 'Tax', value: op.tax, sign: '-' },
    { label: 'Insurance', value: op.insurance, sign: '-' },
    { label: 'Rent', value: op.rent, sign: '-' },
    { label: 'Marketing', value: op.marketing, sign: '-' },
    { label: 'Maintenance', value: op.maintenance, sign: '-' },
    { label: 'Supplies', value: op.supplies, sign: '-' },
    { label: 'Cleaning', value: op.cleaning, sign: '-' },
    { label: 'Delivery / transport', value: op.delivery, sign: '-' },
    { label: 'Other', value: op.other, sign: '-' },
  ]), [op]);

  const investingLines = useMemo(() => ([
    { label: 'Equipment and tools', value: inv.equipmentAndTools, sign: '-' },
    { label: 'Vehicles', value: inv.vehicles, sign: '-' },
    { label: 'Furniture', value: inv.furniture,  sign: '-' },
    { label: 'Machineries', value: inv.machineries, sign: '-' },
    { label: 'Building', value: inv.building, sign: '-' },
    { label: 'Land', value: inv.land,  sign: '-' },
    { label: 'Facility Upgrades', value: inv.facilityUpgrades, sign: '-' },
    { label: 'External investment', value: inv.externalInvestment, sign: '-' },
    { label: 'Asset sale proceeds', value: inv.assetSaleProceeds, sign: '+' },
  ]), [inv]);

  const financingLines = useMemo(() => ([
    { label: 'Loan proceeds', value: fin.loanProceeds,  sign: '+' },
    { label: 'Loan repayments (with interest)', value: fin.loanRepaymentsFull,  sign: '-' },
    { label: 'Owner / investor capital', value: fin.ownerInvestorCapital, sign: '+' },
    { label: 'Owner drawings', value: fin.ownerDrawings, sign: '-' },
  ]), [fin]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Cash Flow Statement</h1>
          <p className="text-gray-500 text-sm italic mt-1">
            Period-over-period cash activity and liquidity reconciliation.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Download size={18} />}
          onClick={() => dispatch(exportFinanceReport({
            reportType: 'cashflow',
            format: 'pdf',
            filters: dateRange === 'custom' ? { startDate, endDate } : { period: dateRange },
          }))}
        >
          Export PDF
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-gray-50/50 border-none shadow-sm overflow-visible relative z-50">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-48 overflow-visible">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Period</label>
            <Select
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
            <div className="flex gap-2 items-center animate-in slide-in-from-left-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-gray-300">to</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Calculating cash movements..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Net Operating Cash" value={cashFlow.netOperatingCash} icon={<Wallet size={20} />} theme="emerald" fmt={fmt} />
            <SummaryCard title="Net Investing Cash" value={cashFlow.netInvestingCash} icon={<TrendingDown size={20} />} theme="red" fmt={fmt} />
            <SummaryCard title="Net Financing Cash" value={cashFlow.netFinancingCash} icon={<Landmark size={20} />} theme="indigo" fmt={fmt}/>
            <Card className="border-l-4 border-l-amber-500">
              <span className="text-xs font-bold text-gray-400 uppercase">Closing Cash Balance</span>
              <p className="text-2xl font-black text-gray-900 mt-1 font-mono">{fmt(cashFlow.closingBalance)}</p>
              <div className="flex items-center gap-1 mt-1 text-amber-600">
                <History size={12} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Current Liquidity</span>
              </div>
            </Card>
          </div>

          {/* Three-column Statement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatementSection
              title="Operations"
              subtitle="Cash from daily core business"
              lines={operatingLines}
              totalLabel="Net Operating Cash"
              totalValue={cashFlow.netOperatingCash}
              accent="emerald"
              fmt={fmt}
            />
            <StatementSection
              title="Investing"
              subtitle="Growth & capital assets"
              lines={investingLines}
              totalLabel="Net Investing Cash"
              totalValue={cashFlow.netInvestingCash}
              accent="red"
              fmt={fmt}
            />
            <StatementSection
              title="Financing"
              subtitle="Capital structure & debt"
              lines={financingLines}
              totalLabel="Net Financing Cash"
              totalValue={cashFlow.netFinancingCash}
              accent="indigo"
              fmt={fmt}
            />
          </div>

          {/* Final Reconciliation Roll-up */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-gray-400" /> Statement of Cash Position
            </h3>
            <div className="space-y-2.5 max-w-md ml-auto">
              <RollupRow label="Opening Cash Balance" value={cashFlow.initialCashBalance} fmt={fmt} isOpening />
              <RollupRow label="Net Operating Cash Flow" value={cashFlow.netOperatingCash} fmt={fmt} />
              <RollupRow label="Net Investing Cash Flow" value={cashFlow.netInvestingCash} fmt={fmt} />
              <RollupRow label="Net Financing Cash Flow" value={cashFlow.netFinancingCash} fmt={fmt} />
              
              <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-gray-900">
                <span className="text-sm font-black uppercase text-gray-900">Closing Cash Balance</span>
                <span className="text-lg font-black font-mono text-gray-900">{fmt(cashFlow.closingBalance)}</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, icon, theme, fmt }) => {
  const themes = {
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    red: 'text-red-600 bg-red-50',
  };
  const isNegative = (value || 0) < 0;
  return (
    <Card hoverable className="relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{title}</span>
          <p className={`text-2xl font-black mt-1 font-mono ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
            {isNegative ? '-' : ''}{fmt(value)}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${themes[theme]}`}>{icon}</div>
      </div>
    </Card>
  );
};

const StatementSection = ({ title, subtitle, lines, totalLabel, totalValue, accent, fmt }) => {
  const accents = {
    emerald: 'bg-emerald-50 text-emerald-900',
    red: 'bg-red-50 text-red-900',
    indigo: 'bg-indigo-50 text-indigo-900',
  };
  return (
    <Card className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{subtitle}</p>
      </div>
      <div className="space-y-2.5 flex-grow">
        {lines.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm border-b border-gray-50 pb-2">
            <span className="text-gray-500">{item.label}</span>
            <span className={`font-mono font-medium ${item.sign === '-' ? 'text-red-500' : 'text-emerald-600'}`}>
              {item.sign} {fmt(item.value)}
            </span>
          </div>
        ))}
      </div>
      <div className={`mt-6 p-3 rounded-lg flex justify-between items-center ${accents[accent]}`}>
        <span className="text-xs font-bold uppercase">{totalLabel}</span>
        <span className="font-black font-mono">
          {(totalValue || 0) < 0 ? '-' : ''}{fmt(totalValue)}
        </span>
      </div>
    </Card>
  );
};

const RollupRow = ({ label, value, fmt, isOpening = false }) => {
  const isNegative = (value || 0) < 0;
  const prefix = isOpening ? '' : isNegative ? '− ' : '+ ';
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{prefix}{label}</span>
      <span className={`font-mono font-medium ${isNegative ? 'text-red-500' : 'text-gray-700'}`}>
        {isNegative ? '-' : ''}{fmt(value)}
      </span>
    </div>
  );
};

export default CashFlowPage;