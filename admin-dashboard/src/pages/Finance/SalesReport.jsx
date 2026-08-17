import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesReport, exportFinanceReport } from '@/features/finance/financeThunks';
import {
  selectSalesReport,
  selectFinanceLoading,
  selectFinanceError,
} from '@/features/finance/financeSelector';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import Chart from '@/components/ui/Chart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import { Link } from 'react-router-dom';

import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Calendar,
  Layers
} from 'lucide-react';

const SalesReport = ({settings}) => {
  const dispatch = useDispatch();

  // Redux State
  const report = useSelector(selectSalesReport) || {};
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);

  // Local State
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
  if (dateRange !== 'custom' || (startDate && endDate)) {
    const params = dateRange === 'custom' 
      ? { startDate, endDate } 
      : { period: dateRange };
    dispatch(fetchSalesReport(params));
  }
}, [dispatch, dateRange, startDate, endDate]);

  // Memoized Chart Data - Combines Revenue (Bars) and Orders (Line)
  const chartData = useMemo(() => ({
    labels: report?.dailySales?.map(d => d.date) || [],
    datasets: [
      {
        type: 'bar',
        label: 'Revenue (LKR)',
        data: report?.dailySales?.map(d => d.revenue) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Orders',
        data: report?.dailySales?.map(d => d.orders) || [],
        borderColor: '#10b981',
        borderWidth: 3,
        pointRadius: 4,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  }), [report]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">
          <Link to="/finance" className="hover:text-indigo-600 transition-colors">Finance</Link>
          <span className="opacity-30">/</span>
          <span className="text-slate-600">Sales Analytics</span>
        </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Sales Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track revenue, order volume, and menu performance.</p>
        </div>
        <div className="flex gap-2">
          
          <Button variant="primary" leftIcon={<Download size={18} />}
            onClick={() => dispatch(exportFinanceReport({
              reportType: 'sales',
              format: 'pdf',
              filters: dateRange === 'custom' ? { startDate, endDate } : { period: dateRange },
            }))}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Modern Filter Card */}
      <Card className="p-4 bg-gray-50/50 border-none shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-48">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Select Period</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white outline-none"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-300">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="text-gray-300">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Aggregating sales data..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SalesKPI 
              title="Total Revenue" 
              value={report?.totalRevenue} 
              growth={report?.revenueGrowth} 
              icon={<DollarSign size={20} />} 
              color="indigo"
              prefix="Rs. "
            />
            <SalesKPI 
              title="Total Orders" 
              value={report?.totalOrders} 
              growth={report?.ordersGrowth} 
              icon={<ShoppingCart size={20} />} 
              color="emerald"
            />
            <SalesKPI 
              title="Avg. Order Value" 
              value={report?.avgOrderValue} 
              icon={<TrendingUp size={20} />} 
              color="purple"
              prefix="Rs. "
            />
            <Card className="border-l-4 border-l-orange-500">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Top Performer</span>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                {report?.topProduct || 'N/A'}
              </p>
              <p className="text-xs text-orange-600 font-medium">
                Rs. {(report?.topProductRevenue || 0).toLocaleString()} in sales
              </p>
            </Card>
          </div>

          {/* Sales Chart */}
          <Card title="Sales & Order Volume Trend pb-8">
             
            <div className="h-80 mt-4 mb-10">
              <Chart 
                type="bar" 
                data={chartData} 
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: { position: 'left', grid: { color: '#f3f4f6' } },
                    y1: { position: 'right', grid: { display: false } }
                  }
                }} 
              />
            </div>
          </Card>

          {/* Product Performance Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Layers size={18} className="text-indigo-500" />
                Product Performance Breakdown
              </h3>
              <Badge variant="info">{report?.topProducts?.length || 0} Items</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-400 bg-white">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Qty Sold</th>
                    <th className="px-6 py-4">Gross Revenue</th>
                    <th className="px-6 py-4">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report?.topProducts?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-700">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm font-mono font-bold text-indigo-600">
                        Rs. {item.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium w-8">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

// Small Reusable Components 

const SalesKPI = ({ title, value, growth, icon, color, prefix = "" }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card className="relative group border-none shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
          <p className="text-2xl font-black text-gray-900 mt-1 font-mono italic">
            {prefix}{(value || 0).toLocaleString()}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl transition-transform group-hover:rotate-12 ${colors[color]}`}>
          {icon}
        </div>
      </div>
      {growth !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <Badge variant={growth >= 0 ? 'success' : 'danger'}>
            {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(growth)}%
          </Badge>
          <span className="text-[10px] text-gray-400 font-medium">from prev period</span>
        </div>
      )}
    </Card>
  );
};

export default SalesReport;