import React, { useState, useEffect, useCallback } from 'react';
import { X, Calculator, TrendingUp, AlertTriangle, CheckCircle2, Loader2, DollarSign } from 'lucide-react';
import api from '@/services/api';
import Button from '@/components/common/Button';

const PriceCalculatorModal = ({ menuItemId, menuItemName, currentPrice, isOpen, onClose, onPriceApplied }) => {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [data, setData] = useState(null);
  const [margin, setMargin] = useState(30);
  const [error, setError] = useState(null);
  const [applied, setApplied] = useState(false);

  const fetchCalculation = useCallback(async (marginValue) => {
    if (!menuItemId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/menu/${menuItemId}/price-calculator`, {
        params: { margin: marginValue },
      });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate price');
    } finally {
      setLoading(false);
    }
  }, [menuItemId]);

  useEffect(() => {
    if (isOpen) {
      setData(null);
      setError(null);
      setApplied(false);
      setMargin(30);
      fetchCalculation(30);
    }
  }, [isOpen, menuItemId]);

  useEffect(() => {
    if (!isOpen || data === null) return;
    const timer = setTimeout(() => fetchCalculation(margin), 400);
    return () => clearTimeout(timer);
  }, [margin]);

  const handleApplyPrice = async () => {
    if (!data?.suggestedPrice) return;
    setApplying(true);
    try {
      await api.patch(`/menu/${menuItemId}/price`, { price: data.suggestedPrice });
      setApplied(true);
      onPriceApplied?.(data.suggestedPrice);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply price');
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  const hasRecipe = data && data.breakdown && data.breakdown.length > 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-8 pt-8 pb-4 border-b border-slate-100 rounded-t-[2.5rem] z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Calculator size={20} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Price Calculator
                </h2>
              </div>
              <p className="text-slate-500 text-sm font-medium ml-11">
                {menuItemName} — cost-based pricing suggestion
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="text-slate-400" size={20} />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">

          {/* Feedback banners */}
          {applied && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <p className="text-sm font-bold text-emerald-800">Price applied successfully!</p>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="text-rose-500" size={18} />
              <p className="text-sm font-bold text-rose-800">{error}</p>
            </div>
          )}
          {data?.hasMissingCostData && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3">
              <AlertTriangle className="text-amber-500" size={18} />
              <p className="text-sm font-bold text-amber-800">
                Some ingredients have missing cost/unit data — this cost figure may be incomplete.
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && !data && (
            <div className="border-2 border-dashed border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Calculating ingredient cost...
              </p>
            </div>
          )}

          {/* No recipe linked */}
          {data && !hasRecipe && (
            <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                No recipe linked yet — link ingredients via Recipe Builder to calculate cost
              </p>
            </div>
          )}

          {/* Cost Breakdown Section */}
          {data && hasRecipe && (
            <>
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">
                  Ingredient Cost Breakdown
                </h3>
                <div className="space-y-2">
                  {data.breakdown.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-slate-50 rounded-2xl p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">
                          {line.ingredientName}
                          {line.warning && (
                            <AlertTriangle size={12} className="inline ml-1.5 text-amber-500" />
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {line.quantityRequired} {line.unit} @ Rs. {line.costPerUnit?.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-black text-slate-900 shrink-0">
                        Rs. {line.lineCost?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 px-4 py-3 bg-indigo-50 rounded-2xl">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                    Total Ingredient Cost
                  </p>
                  <p className="text-lg font-black text-indigo-700">Rs. {data.cost.toFixed(2)}</p>
                </div>
              </div>

              {/* Current price / margin */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Current Price
                  </p>
                  <p className="text-2xl font-black text-slate-900">Rs. {currentPrice?.toLocaleString()}</p>
                  {data.currentMargin !== null && (
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      Current margin: {data.currentMargin}%
                    </p>
                  )}
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white">
                  <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">
                    Suggested Price
                  </p>
                  <p className="text-2xl font-black">
                    {loading ? '…' : `Rs. ${data.suggestedPrice}`}
                  </p>
                  <p className="text-xs font-bold text-indigo-100 mt-1">
                    at {margin}% margin
                    {data.exactSuggestedPrice != null && (
                      <span className="opacity-75"> · exact: Rs. {data.exactSuggestedPrice.toFixed(2)}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Margin slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-600" /> Target Profit Margin
                  </h3>
                  <span className="font-black text-indigo-600 text-sm">{margin}%</span>
                </div>
                <input
                  type="range" min="0" max="80" step="1"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  <span>0%</span>
                  <span>80%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-8 py-6 border-t border-slate-100 rounded-b-[2.5rem]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {data?.ingredientCount || 0} ingredient{data?.ingredientCount !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <Button variant="white" onClick={onClose} className="rounded-xl h-11 px-6 font-bold border-slate-200">
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleApplyPrice}
                disabled={!hasRecipe || applying || loading || !data?.suggestedPrice}
                className="rounded-xl h-11 px-8 font-black shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                <DollarSign size={16} />
                {applying ? 'Applying...' : 'Apply This Price'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculatorModal;