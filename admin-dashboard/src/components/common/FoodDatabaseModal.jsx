import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Database, Barcode, Plus, X, CheckCircle2, Loader2 } from 'lucide-react';
import { searchFoodDatabase, importFromUSDA } from '@/features/inventory/inventoryThunks';
import { cn } from '@/utils/cn';
import Button from '@/components/common/Button';

const FoodDatabaseModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const results = useSelector(s => s.inventory.foodSearchResults || []);
  const searching = useSelector(s => s.inventory.foodSearchLoading);
  const success = useSelector(s => s.inventory.successMessage);
  const error = useSelector(s => s.inventory.error);

  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState(null);
  const [imported, setImported] = useState(new Set()); 
  const [costMap, setCostMap]  = useState({}); 

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length < 2 || searching) return; 
    dispatch(searchFoodDatabase({ query: query.trim() }));
  };

  const handleImport = async (item) => {
    setImporting(item.fdcId);
    const result = await dispatch(importFromUSDA({
      fdcId:        item.fdcId,
      costPerUnit:  parseFloat(costMap[item.fdcId] || 0),
      minimumStock: 5
    }));

    if (importFromUSDA.fulfilled.match(result)) {
      setImported(prev => new Set([...prev, item.fdcId]));
    } else {
      console.error('Import failed:', result.payload);
    }
    setImporting(null);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Database size={20} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Food Database
                </h2>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-11">
                USDA FoodData Central — 700k+ ingredients
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mt-5">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search ingredients... (e.g. tomato, chicken breast, rice)"
                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={searching || query.trim().length < 2}
              className="h-12 px-6 rounded-2xl font-bold shadow-lg shadow-emerald-200 bg-emerald-500 hover:bg-emerald-600 border-emerald-500"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-3">
          {searching && (
            <div className="py-12 text-center">
              <Loader2 size={28} className="animate-spin text-emerald-500 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Searching USDA database...
              </p>
            </div>
          )}

          {!searching && results.length === 0 && query && (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                No results — try a different search term
              </p>
            </div>
          )}

          {!searching && results.length === 0 && !query && (
            <div className="py-12 text-center space-y-2">
              <Database size={32} className="text-slate-200 mx-auto" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Search to populate ingredients from USDA
              </p>
              <p className="text-xs text-slate-300 font-medium">
                Try: "chicken", "basmati rice", "tomato", "olive oil"
              </p>
            </div>
          )}

          {results.map((item) => {
            const isImported  = imported.has(item.fdcId);
            const isImporting = importing === item.fdcId;

            return (
              <div key={item.fdcId} className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                isImported ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 hover:border-slate-200"
              )}>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-bold text-sm truncate",
                    isImported ? "text-emerald-800" : "text-slate-800"
                  )}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                      {item.category}
                    </span>
                    {item.nutrients?.calories > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.nutrients.calories} kcal/100g
                      </span>
                    )}
                    {item.nutrients?.protein > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Protein: {item.nutrients.protein}g
                      </span>
                    )}
                  </div>
                </div>

                {/* Cost input */}
                {!isImported && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-slate-400 font-bold">LKR</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost/unit"
                      value={costMap[item.fdcId] || ''}
                      onChange={e => setCostMap(prev => ({ ...prev, [item.fdcId]: e.target.value }))}
                      className="w-24 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                )}

                {/* Action */}
                {isImported ? (
                  <div className="flex items-center gap-2 text-emerald-600 shrink-0">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">Added</span>
                  </div>
                ) : (
                  <Button
                    variant="white"
                    onClick={() => handleImport(item)}
                    disabled={isImporting}
                    className="h-9 px-4 rounded-xl text-xs font-black border-slate-200 text-emerald-600 hover:border-emerald-300 shrink-0"
                  >
                    {isImporting
                      ? <Loader2 size={14} className="animate-spin" />
                      : <><Plus size={13} className="mr-1" />Import</>
                    }
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Powered by USDA FoodData Central · Free Public API
            </p>
            <Button variant="white" onClick={onClose} className="rounded-xl h-10 px-6 font-bold border-slate-200 text-xs">
              Done
            </Button>
            {error && (
              <p className="text-xs text-rose-500 font-bold">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDatabaseModal;