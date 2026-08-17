import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Package, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw,
  Loader2
} from 'lucide-react';

// Redux Imports
import { 
  fetchInventory, 
  toggleItemAvailability 
} from '@/features/inventory/inventoryThunks';
import { 
  selectAllInventoryItems, 
  selectInventoryLoading, 
  selectInventoryCategories,
  selectLowStockItems,
  selectOutOfStockItems, 
} from '@/features/inventory/inventorySelectors';

import Badge from '@/components/ui/Badge';
import Button from '@/components/common/Button';
import { getStockStatus, stockStatusConfig } from '@/utils/inventoryStatus';

const Inventory = () => {
  const dispatch = useDispatch();
  
  // Redux State
  const items = useSelector(selectAllInventoryItems);
  const categories = useSelector(selectInventoryCategories);
  const isLoading = useSelector(selectInventoryLoading);

  const [stockFilter, setStockFilter] = useState('all');

  const outOfStockItems = useSelector(selectOutOfStockItems);
  const lowStockItems = useSelector(selectLowStockItems);

  // Local UI State (Search/Filter only)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Initial Fetch
  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  // Filter Logic (Memoized for performance)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;

      const status = getStockStatus(item);
      const matchesStockFilter =
        stockFilter === 'all' ||
        (stockFilter === 'low' && status === 'low') ||
        (stockFilter === 'out' && status === 'out');

      return matchesSearch && matchesCategory && matchesStockFilter;
    });
  }, [items, searchTerm, filterCategory, stockFilter]);

  // Action Handler (The "86" Action)
  const handleToggleStatus = (itemId, currentStatus) => {
    dispatch(toggleItemAvailability({ 
      itemId, 
      isAvailable: !currentStatus 
    }));
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest animate-pulse">Syncing Pantry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-2 border-b border-slate-800 pb-px">
      {[
        { key: 'all', label: 'All Items', count: items.length },
        { key: 'low', label: 'Low Stock', count: lowStockItems.length },
        { key: 'out', label: 'Out of Stock', count: outOfStockItems.length },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setStockFilter(tab.key)}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all flex items-center gap-2 ${
            stockFilter === tab.key
              ? 'bg-slate-900 text-orange-500 border-t border-x border-slate-800'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
              tab.key === 'out' ? 'bg-rose-500/20 text-rose-400' :
              tab.key === 'low' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-800 text-slate-400'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 shadow-lg shadow-orange-900/10">
            <Package className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight italic uppercase">
              86-LIST / <span className="text-orange-500">INVENTORY</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Live Menu Availability & Stock Control
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:row gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500" size={16} />
            <input 
              type="text"
              placeholder="Quick find item..."
              className="bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 w-full sm:w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Grid  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const status = getStockStatus(item);
          const cfg = stockStatusConfig[status];

          return (
            <div
              key={item._id}
              className={`group p-5 rounded-3xl border transition-all duration-300 ${cfg.bg} ${cfg.border} hover:border-slate-600`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-tighter">
                    {item.category}
                  </p>
                  <h3 className={`font-bold text-lg leading-tight ${item.isAvailable ? 'text-white' : 'text-rose-200/50 line-through'}`}>
                    {item.name}
                  </h3>
                </div>
                <Badge variant={item.isAvailable ? 'success' : 'danger'}>
                  {item.isAvailable ? 'ACTIVE' : '86-ED'}
                </Badge>
              </div>

              <div className="flex items-center justify-between mt-8">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-600 uppercase italic mb-0.5">Stock Level</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status !== 'healthy' ? 'animate-pulse' : ''}`} />
                    <span className={`text-xl font-mono font-black ${cfg.text}`}>
                      {item.currentStock} <span className="text-xs">{item.unit}</span>
                    </span>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>

                <Button
                  variant={item.isAvailable ? 'danger' : 'success'}
                  size="sm"
                  onClick={() => handleToggleStatus(item._id, item.isAvailable)}
                  icon={item.isAvailable ? XCircle : CheckCircle2}
                  className="rounded-2xl shadow-lg px-4"
                >
                  {item.isAvailable ? '86 ITEM' : 'RESTOCK'}
                </Button>
              </div>
            </div>
          );
        })}

            
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && !isLoading && (
        <div className="text-center py-24 bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-800">
          <RefreshCcw size={48} className="mx-auto text-slate-800 mb-4" />
          <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-sm">
            Search result empty
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setFilterCategory('All'); }}
            className="mt-4 text-orange-500 text-xs font-bold underline underline-offset-4"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;