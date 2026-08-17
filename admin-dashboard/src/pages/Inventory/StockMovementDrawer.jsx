import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, TrendingDown, TrendingUp, Package, Wrench } from 'lucide-react';
import { fetchStockMovements } from '@/features/inventory/inventoryThunks';
import { selectStockMovements, selectMovementsLoading } from '@/features/inventory/inventorySelector';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

const TYPE_CONFIG = {
  SALE:            { icon: TrendingDown, color: 'text-rose-500',   bg: 'bg-rose-50',   label: 'Sale' },
  RESTOCK:         { icon: TrendingUp,   color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Restock' },
  WASTE:           { icon: Package,      color: 'text-amber-500',  bg: 'bg-amber-50',  label: 'Waste' },
  ADJUSTMENT:      { icon: Wrench,       color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Adjust' },
  KITCHEN_REQUEST: { icon: Package,      color: 'text-purple-500', bg: 'bg-purple-50', label: 'Kitchen' },
  CUSTOMIZATION:   { icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Custom' },
};

const StockMovementDrawer = ({ isOpen, onClose, item }) => {
  const dispatch = useDispatch();
  const movements = useSelector(selectStockMovements);
  const loading = useSelector(selectMovementsLoading);

  useEffect(() => {
    if (isOpen && item) {
      dispatch(fetchStockMovements({ itemId: item._id || item.id }));
    }
  }, [isOpen, item, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-8 pb-5 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                Stock History
              </h2>
              <p className="text-slate-500 text-sm font-medium mt-0.5">{item?.name}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900">{item?.currentStock}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-500">{item?.minimumStock}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min Level</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-indigo-600">
                    LKR {((item?.currentStock || 0) * (item?.costPerUnit || 0)).toLocaleString()}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Value</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Movement List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : movements.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                No movement history yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((mov) => {
                const config = TYPE_CONFIG[mov.type] || TYPE_CONFIG.ADJUSTMENT;
                const Icon = config.icon;
                const isDeduction = mov.quantityChange < 0;

                return (
                  <div key={mov._id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className={cn("p-2 rounded-xl", config.bg)}>
                      <Icon size={16} className={config.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
                          {config.label}
                        </p>
                        <span className={cn(
                          "text-sm font-black",
                          isDeduction ? "text-rose-600" : "text-emerald-600"
                        )}>
                          {isDeduction ? '' : '+'}{mov.quantityChange} {item?.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] text-slate-400 font-medium">
                          {mov.menuItemId?.name || mov.notes || '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {mov.quantityBefore} → {mov.quantityAfter}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                        {new Date(mov.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockMovementDrawer;