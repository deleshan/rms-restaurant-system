import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExpenditures,
  exportFinanceReport
} from '@/features/finance/financeThunks';
import {
  selectExpenditures,
  selectFinanceLoading,
  selectFinanceError,
  selectPnLReport,
} from '@/features/finance/financeSelector';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import Chart from '@/components/ui/Chart';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import { Download, Plus, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

// Import the Modal we just created
import TransactionModal from './TransactionModal';

const Expenditures = ({settings}) => {
  const dispatch = useDispatch();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Filter States
  const [dateRange, setDateRange] = useState('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Redux Selectors
  const expenditureData = useSelector(selectExpenditures) || {};
  const pnl = useSelector(selectPnLReport) || {};
  const loading = useSelector(selectFinanceLoading);
  const error = useSelector(selectFinanceError);

  // Derived Data
  const expenses = expenditureData.transactions || [];
  const totalExpenses = expenditureData.totalAmount || 0;
  const categories = expenditureData.categoryBreakdown || [];

  useEffect(() => {
    let params = {};
    if (dateRange !== 'custom') {
      params = { period: dateRange };
    } else if (startDate && endDate) {
      params = { startDate, endDate };
    } else {
      return; 
    }
    dispatch(fetchExpenditures(params));
  }, [dispatch, dateRange, startDate, endDate]);

  // Memoized Chart Data
  const expenseCategoryChart = useMemo(() => ({
    labels: categories.length > 0 ? categories.map(c => c.name) : ['No Data'],
    datasets: [{
      data: categories.length > 0 ? categories.map(c => c.value) : [1],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#6b7280'],
      borderWidth: 0,
    }],
  }), [categories]);

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    { key: 'description', label: 'Description', sortable: true },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.category}
        </Badge>
      ),
    },
    { key: 'paidTo', label: 'Paid To' },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-red-600">
          - {settings?.currency} {row.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button
          onClick={() => setEditingExpense(row)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenditures</h1>
          <p className="text-gray-500">Track and analyze operational spending</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Download size={18} />} onClick={() => dispatch(exportFinanceReport({
              reportType: 'expenditures',
              format: 'pdf',
              filters: { period: dateRange, ...(dateRange === 'custom' ? { startDate, endDate } : {}) },
            }))}>
            Export
          </Button>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-gray-50 border-none shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-600 mr-2">
            <Filter size={18} />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="today">Today</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
              <input 
                type="date" 
                className="text-sm rounded-md border-gray-300" 
                onChange={(e) => setStartDate(e.target.value)} 
              />
              <span className="text-gray-400 text-sm">to</span>
              <input 
                type="date" 
                className="text-sm rounded-md border-gray-300" 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner message="Calculating expenses..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="Total Outflow" hoverable>
              <p className="text-3xl font-bold text-red-600">
                {settings?.currency} {totalExpenses.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <Badge variant={pnl.expenseGrowth > 0 ? 'danger' : 'success'}>
                  {pnl.expenseGrowth > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(pnl.expenseGrowth || 0)}%
                </Badge>
                <span className="text-gray-500">vs last month</span>
              </div>
            </Card>

            <Card title="Top Category" hoverable>
              <p className="text-xl font-bold text-gray-900 truncate">
                {categories[0]?.name || 'No Data'}
              </p>
              <p className="text-red-600 font-semibold mt-1">
                {settings?.currency} {categories[0]?.value?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Highest spend this period</p>
            </Card>

            <Card title="Budget Utilization" hoverable>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: '65%' }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-gray-600 font-medium">65% used</span>
                <span className="text-gray-400">Target: &lt; 80%</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <Card title="Spending Breakdown" className="lg:col-span-1">
              <div className="h-64 mt-4">
                <Chart 
                  type="pie" 
                  data={expenseCategoryChart} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } } 
                  }} 
                />
              </div>
            </Card>

            {/* Main Table */}
            <Card title="Transaction History" className="lg:col-span-2 overflow-hidden">
              <DataTable 
                columns={columns} 
                data={expenses} 
                emptyMessage="No expenses found for this period."
              />
            </Card>
          </div>
        </>
      )}

      {/* Transaction Entry Modal */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type="expense"
      />
      <TransactionModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        type="expense"
        mode="edit"
        initialData={editingExpense}
      />
    </div>
  );
};

export default Expenditures;