import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';

const DataTable = ({
  columns,           
  data,               
  loading = false,
  onRowClick,
  actions,           
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  rowsPerPageOptions = [5, 10, 20, 50],
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Filter data
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full pl-10 pr-4 py-2 border rounded-xl transition-all duration-300 focus:ring-2 focus:ring-brand/20 focus:outline-none placeholder:text-slate-500",
              isDark 
                ? "bg-slate-900/40 border-white/10 text-white focus:bg-slate-900/60" 
                : "bg-white/40 border-gray-200 text-slate-900 focus:bg-white/80"
            )}
          />
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand/20 outline-none transition-all",
              isDark 
                ? "bg-slate-900/40 border-white/10 text-slate-300" 
                : "bg-white/40 border-gray-200 text-slate-700"
            )}
          >
            {rowsPerPageOptions.map(num => (
              <option key={num} value={num} className={isDark ? "bg-slate-900" : "bg-white"}>
                {num} per page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-300",
        isDark ? "bg-slate-900/40 border-white/10 shadow-black/20" : "bg-white/60 border-white shadow-lg shadow-slate-200/20"
      )}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y transition-colors duration-300" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead className={isDark ? "bg-white/5" : "bg-slate-50/50"}>
              <tr className={isDark ? "divide-white/5" : "divide-gray-200"}>
                {columns.map(col => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider transition-colors',
                      isDark ? 'text-slate-400' : 'text-slate-500',
                      col.sortable && (isDark ? 'cursor-pointer hover:text-brand' : 'cursor-pointer hover:text-gray-700')
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <ArrowUpDown size={14} className={cn(
                          "transition-transform",
                          sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'rotate-180 text-brand' : 'opacity-50'
                        )} />
                      )}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className={cn(
                    "px-6 py-4 text-right text-xs font-bold uppercase tracking-wider",
                    isDark ? "text-slate-400" : "text-slate-500"
                  )}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody className={cn("divide-y transition-colors", isDark ? "divide-white/5" : "divide-gray-100")}>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-20 text-center">
                    <div className="animate-pulse space-y-4">
                      <div className={cn("h-4 rounded w-3/4 mx-auto", isDark ? "bg-slate-800" : "bg-gray-200")}></div>
                      <div className={cn("h-4 rounded w-full mx-auto", isDark ? "bg-slate-800" : "bg-gray-200")}></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-20 text-center text-slate-500 font-medium">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      'transition-all duration-200',
                      onRowClick && 'cursor-pointer',
                      isDark ? 'hover:bg-white/5' : 'hover:bg-brand/5'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map(col => (
                      <td key={col.key} className={cn(
                        "px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors",
                        isDark ? "text-slate-300" : "text-slate-700"
                      )}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Container */}
      {!loading && paginatedData.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className={cn("text-sm font-medium", isDark ? "text-slate-500" : "text-slate-600")}>
            Showing <span className={isDark ? "text-slate-300" : "text-slate-900"}>{startIndex + 1}</span> to <span className={isDark ? "text-slate-300" : "text-slate-900"}>{Math.min(startIndex + rowsPerPage, sortedData.length)}</span> of <span className={isDark ? "text-slate-300" : "text-slate-900"}>{sortedData.length}</span> entries
          </div>

          <div className="flex items-center space-x-2">
            {[
              { icon: ChevronsLeft, onClick: () => setCurrentPage(1), disabled: currentPage === 1 },
              { icon: ChevronLeft, onClick: () => setCurrentPage(prev => Math.max(prev - 1, 1)), disabled: currentPage === 1 },
              { icon: ChevronRight, onClick: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)), disabled: currentPage === totalPages },
              { icon: ChevronsRight, onClick: () => setCurrentPage(totalPages), disabled: currentPage === totalPages },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.onClick}
                disabled={btn.disabled}
                className={cn(
                  "p-2 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed",
                  isDark 
                    ? "bg-slate-900/40 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-brand" 
                    : "bg-white/40 border-gray-200 text-slate-600 hover:bg-white hover:text-brand shadow-sm"
                )}
              >
                <btn.icon size={16} />
              </button>
            ))}
            
            <div className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest",
              isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-600"
            )}>
              {currentPage} / {totalPages}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;