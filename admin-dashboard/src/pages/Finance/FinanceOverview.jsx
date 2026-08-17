import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Receipt 
} from 'lucide-react';
import Card from '@/components/common/Card';
import Badge from '@/components/ui/Badge';
import Chart from '@/components/ui/Chart';


const FinanceOverview = ({ overview, revenueBreakdown, primeCost, cashRunway, debtToEquity, payables, settings  }) => {
  const monthlyTrendData = {
    labels: overview?.monthly?.length > 0 
      ? overview.monthly.map(m => m.month) 
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: overview?.monthly?.length > 0 
          ? overview.monthly.map(m => m.revenue) 
          : [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.6)', 
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Net Profit',
        data: overview?.monthly?.length > 0 
          ? overview.monthly.map(m => m.profit) 
          : [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(16, 185, 129, 0.6)', 
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { usePointStyle: true, padding: 20, font: { weight: '600' } }
      },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#f3f4f6' },
        ticks: { callback: (value) => 'Rs.' + value.toLocaleString() }
      },
      x: { grid: { display: false } }
    },
  };

  const kpis = [
    {
      title: 'Total Revenue',
      value: overview?.totalRevenue,
      growth: overview?.revenueGrowth,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Net Profit',
      value: overview?.netProfit,
      growth: overview?.profitGrowth,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Cash Balance',
      value: overview?.cashBalance,
      subText: 'Liquid Assets',
      icon: Wallet,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pending Receivables',
      value: overview?.pendingPayments,
      subText: `${overview?.pendingCount || 0} Unpaid customer orders`,
      icon: Receipt,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Accounts Payable',
      value: payables?.totalOwed,
      subText: payables?.overdueTotal > 0
        ? `LKR ${payables.overdueTotal.toLocaleString()} overdue`
        : 'Owed to suppliers',
      icon: Receipt,
      color: payables?.overdueTotal > 0 ? 'text-rose-600' : 'text-slate-600',
      bgColor: payables?.overdueTotal > 0 ? 'bg-rose-50' : 'bg-slate-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-5 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {settings?.currency} {kpi.value?.toLocaleString() || '0'}
                </h3>
                
                {kpi.growth !== undefined ? (
                  <div className="mt-2 flex items-center">
                    <Badge variant={kpi.growth >= 0 ? 'success' : 'danger'}>
                      {kpi.growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(kpi.growth)}%
                    </Badge>
                    <span className="ml-2 text-[10px] font-medium text-slate-400 uppercase">vs last month</span>
                  </div>
                ) : (
                  <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {kpi.subText}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm" title="Performance Trend">
          <div className="h-[400px] mt-6">
            <Chart
              type="bar"
              data={monthlyTrendData}
              options={chartOptions}
            />
          </div>
        </Card>

        <Card className="border-none shadow-sm" title="Business Insights">
          <div className="space-y-5 mt-4">

            {/* 1. Revenue by category */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Revenue by Category
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Main Course', value: revenueBreakdown?.mainCourse, color: 'bg-indigo-500' },
                  { label: 'Appetizers', value: revenueBreakdown?.appetizers, color: 'bg-emerald-500' },
                  { label: 'Beverages', value: revenueBreakdown?.beverages, color: 'bg-amber-500' },
                  { label: 'Bread', value: revenueBreakdown?.bread, color: 'bg-purple-500' },
                  { label: 'Other', value: revenueBreakdown?.otherFood, color: 'bg-slate-400' },
                ].map((row) => {
                  const total = Object.values(revenueBreakdown || {}).reduce((s, v) => s + (v || 0), 0);
                  const pct = total > 0 ? Math.round(((row.value || 0) / total) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`${row.color} h-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2 & 3. Prime Cost + Cash Runway side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Prime Cost</p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {primeCost?.percentage?.toFixed(1) || '0.0'}%
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Target: 55–65%</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cash Runway</p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {cashRunway === '∞' ? '∞' : `${cashRunway} mo`}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">At current burn rate</p>
              </div>
            </div>

            {/* 4 & 5. Debt-to-Equity + Accounts Payable */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Debt-to-Equity</p>
                <p className="text-lg font-black text-slate-900 mt-1">{debtToEquity}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Payables Due</p>
                <p className="text-lg font-black text-slate-900 mt-1">
                  LKR {(payables?.totalOwed || 0).toLocaleString()}
                </p>
                {payables?.overdueTotal > 0 && (
                  <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                    LKR {payables.overdueTotal.toLocaleString()} overdue
                  </p>
                )}
              </div>
            </div>

          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinanceOverview;