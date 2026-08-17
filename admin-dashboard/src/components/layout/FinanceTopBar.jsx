import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  History,
  Scale,
  Briefcase,
  Receipt,
  Settings2,
  ArrowLeftRight,
  BanknoteArrowUp
} from 'lucide-react';

const FINANCE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard},
  { id: 'sales', label: 'Sales', icon: TrendingUp},
  { id: 'pnl', label: 'P&L', icon: DollarSign},
  { id: 'cashflow', label: 'Cashflow', icon: History},
  { id: 'balance-sheet', label: 'Balance Sheet', icon: Scale},
  { id: 'assets', label: 'Assets', icon: Briefcase},
  { id: 'expenditures', label: 'Expenditures', icon: Receipt},
  { id: 'transactions', label: 'Transactions & Equity', icon: ArrowLeftRight },
  { id: 'payables', label: 'Payables', icon: BanknoteArrowUp},
  { id: 'setup', label: 'Setup', icon: Settings2},
  
];

const FinanceTopBar = ({ activeTab, onTabChange }) => {
  return (
    <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-3xl">
      <div className="flex gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl overflow-x-auto w-full sm:w-auto">
        {FINANCE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-black 
                transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? 'bg-white text-brand shadow-md shadow-indigo-100/50 ring-1 ring-slate-100 scale-105'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                }
              `}
            >
              {Icon && <Icon size={16} strokeWidth={isActive ? 3 : 2} />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { FINANCE_TABS };
export default FinanceTopBar;