import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Package, Search, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toggleItemAvailability } from '@/features/inventory/inventoryThunks';
import { select86List, selectInventoryLoading } from '@/features/inventory/inventorySelectors';
import Button from '@/components/common/Button';

const InventoryDrawer = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  
  // Select only items that are currently unavailable (86-ed)
  const unavailableItems = useSelector(select86List);
  const isLoading = useSelector(selectInventoryLoading);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Filter the 86-list locally for quick searching
  const filtered86 = unavailableItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestock = (itemId) => {
    dispatch(toggleItemAvailability({ itemId, isAvailable: true }));
  };

  return (
    <>
      {/* Dark Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={onClose} 
      />

      {/* Slide-out Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 shadow-2xl z-[70] transform transition-transform duration-300 border-l border-slate-800 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 h-full flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <Package className="text-rose-500" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight italic uppercase">86-LIST</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {unavailableItems.length} Items Out of Stock
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Search unavailable items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-all" 
            />
          </div>

          {/* Scrollable Item List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {isLoading && unavailableItems.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="text-slate-700 animate-spin" />
              </div>
            ) : filtered86.length > 0 ? (
              filtered86.map((item) => (
                <div 
                  key={item._id} 
                  className="p-4 bg-slate-800/30 border border-slate-800/50 rounded-2xl flex justify-between items-center group hover:bg-slate-800/60 transition-all"
                >
                  <div>
                    <p className="text-slate-100 font-bold text-sm">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">
                      {item.category} • {item.stock} in system
                    </p>
                  </div>
                  <Button 
                    variant="success" 
                    size="sm" 
                    icon={CheckCircle2}
                    onClick={() => handleRestock(item._id)}
                    className="rounded-xl px-3 text-[10px] font-black"
                  >
                    RESTOCK
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
                <AlertCircle className="mx-auto text-slate-700 mb-2" size={32} />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  {searchTerm ? 'No results found' : 'All items available'}
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <Button 
              variant="outline" 
              className="w-full rounded-2xl py-4 font-black uppercase text-xs tracking-widest" 
              onClick={onClose}
            >
              Close Panel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryDrawer;