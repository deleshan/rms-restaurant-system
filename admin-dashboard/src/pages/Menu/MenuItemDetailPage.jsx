import React, { useEffect, useState } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, Edit, Trash2, Package, Info,
  BrainCircuit, Sparkles, AlertTriangle, RefreshCw,
  TrendingUp, Activity, X, Calculator, ChefHat
} from 'lucide-react';
import PriceCalculatorModal from './PriceCalculatorModal';
import RecipeBuilderModal from './RecipeBuilderModal';
// Redux
import { deleteMenuItem, fetchMenuItemInsight, fetchMenuItemById } from '@/features/menu/menuThunks';
import { 
  selectMenuLoading, 
  selectMenuItemInsight, 
  selectMenuInsightLoading, 
  selectSelectedMenuItem, 
  selectSelectedItemMaxMakeable
 } from '@/features/menu/menuSelector';

// Components
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MenuItemForm from './MenuItemForm';

const MenuItemDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [showPriceCalc, setShowPriceCalc] = useState(false);
  const [recipeItem, setRecipeItem] = useState(null);

  // Redux Selectors
  const insight = useSelector(selectMenuItemInsight);
  const insightLoading = useSelector(selectMenuInsightLoading);
  const loading = useSelector(selectMenuLoading);
  const maxMakeable = useSelector(selectSelectedItemMaxMakeable);
  const { settings } = useSelector(state => state.settings);

  const item = useSelector(selectSelectedMenuItem);

  

  useEffect(() => {
    if (id) {
      dispatch(fetchMenuItemById(id));
      dispatch(fetchMenuItemInsight(id)); 
    }
  }, [dispatch, id]);

  if (loading || !item) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f0f2f5]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this item permanently?')) {
      dispatch(deleteMenuItem(item._id));
      navigate('/admin/menu');
    }
  };

  return (
    <div className="relative p-6 min-h-screen rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-100 font-sans">
      {/* BACKGROUND ORBS */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300/30 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-fit mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between backdrop-blur-md bg-white/20 p-3 rounded-2xl border border-white/40 shadow-xl mt-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-white/40 text-slate-700 font-bold rounded-xl transition-all">
            <ArrowLeft size={18} className="mr-2" /> Back to Menu
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="bg-white/40 border-white/60 hover:bg-white/60 text-slate-800 rounded-xl shadow-sm transition-all" onClick={() => setRecipeItem(item)}>
              <ChefHat size={16} className="mr-2"/> Recipe Builder
            </Button>
            <Button variant="outline" onClick={() => setShowPriceCalc(true)} className="bg-white/40 border-white/60 hover:bg-white/60 text-slate-800 rounded-xl shadow-sm transition-all">
              <Calculator size={16} className="mr-2" /> Price Calculator
            </Button>
            <Button variant="outline" onClick={() => handleEditClick(item)} className="bg-white/40 border-white/60 hover:bg-white/60 text-slate-800 rounded-xl shadow-sm transition-all">
              <Edit size={16} className="mr-2" /> Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} className="bg-rose-500/80 backdrop-blur-md hover:bg-rose-600 rounded-xl shadow-lg border border-rose-400/50">
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            {/* Main Product Card */}
            <div className="group relative overflow-hidden backdrop-blur-xl bg-white/30 rounded-[2.5rem] border border-white/50 shadow-2xl transition-all hover:shadow-indigo-200/50">
              <div className="aspect-square relative overflow-hidden m-4 rounded-[2rem] shadow-inner">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/20 text-slate-400 font-black uppercase tracking-widest text-xs">No Image Provided</div>
                )}
                <div className="absolute top-4 left-4 backdrop-blur-xl bg-black/30 px-5 py-1.5 rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  {item.category}
                </div>
                {item.station && (
                  <div className="absolute top-4 right-4 backdrop-blur-xl bg-black/30 px-5 py-1.5 rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                    {item.station}
                  </div>
                )}
              </div>
              <div className="p-8 pt-2">
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter leading-tight mb-2 uppercase italic">{item.name}</h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Pricing</span>
                  <p className="text-3xl font-black text-slate-900">{settings.currency} {item.price?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* AI Insight Section */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative p-7 backdrop-blur-2xl bg-white/40 rounded-[2.5rem] border border-white/60 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl text-white shadow-lg shadow-indigo-200">
                      <BrainCircuit size={20} />
                    </div>
                    <span className="font-black text-slate-800 text-[10px] uppercase tracking-[0.3em]">Neural Insights</span>
                  </div>
                  <button 
                    onClick={() => dispatch(fetchMenuItemInsight(id))} 
                    className="p-2 hover:bg-indigo-100 rounded-full transition-colors text-indigo-600"
                  >
                    <RefreshCw size={16} className={insightLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {insightLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-white/50 animate-pulse rounded-full w-full"></div>
                    <div className="h-4 bg-white/50 animate-pulse rounded-full w-2/3"></div>
                  </div>
                ) : (
                  <div className={`p-5 rounded-3xl border backdrop-blur-md transition-all ${
                    insight?.status === 'warning' 
                      ? 'bg-rose-50/50 border-rose-200/50 text-rose-900' 
                      : 'bg-emerald-50/50 border-emerald-200/50 text-emerald-900'
                  }`}>
                    <div className="flex gap-4">
                      <div className="shrink-0 p-2 bg-white/80 rounded-xl shadow-sm">
                        {insight?.status === 'warning' ? <AlertTriangle size={22} className="text-rose-500" /> : <Sparkles size={22} className="text-emerald-500" />}
                      </div>
                      <p className="text-[13px] font-bold leading-relaxed">{insight?.suggestion || "AI is analyzing current sales trends..."}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {item.isOutOfStock && item.outOfStockIngredients?.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-2">
                  Blocking this item:
                </p>
                <ul className="space-y-1">
                  {item.outOfStockIngredients.map((ing, i) => (
                    <li key={i} className="text-sm text-rose-800">
                      <strong>{ing.name}</strong>: need {ing.required}{ing.unit}, only {ing.available}{ing.unit} in stock
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassStatsCard
                label="Can Make"
                value={maxMakeable != null ? `${maxMakeable} servings` : 'No recipe'}
                icon={<Package className="text-blue-600" />}
              />
              <GlassStatsCard
                label="Stock Status"
                value={item.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                icon={<Activity className={item.isOutOfStock ? 'text-rose-600' : 'text-emerald-600'} />}
              />
              <GlassStatsCard label="Visibility" value={item.isAvailable ? 'Public' : 'Hidden'} icon={<Activity className="text-purple-600" />} />
            </div>

            <div className="p-8 backdrop-blur-xl bg-white/30 rounded-[2.5rem] border border-white/50 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Info size={18} className="text-indigo-600" />
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Item Story</h3>
              </div>
              <p className="text-xl font-medium text-slate-700 leading-relaxed italic opacity-80">
                "{item.description || 'No description provided for this culinary creation.'}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Recipe/Ingredients */}
              <div className="p-8 backdrop-blur-xl bg-white/30 rounded-[2.5rem] border border-white/50 shadow-xl">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Package size={16} className="text-indigo-600" /> Recipe Base
                </h3>
                <div className="space-y-4">
                  {item.ingredients?.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-white/40 border border-white/60 rounded-2xl hover:bg-white/60 transition-all">
                      <span className="font-black text-[10px] text-slate-500 uppercase tracking-tighter">
                        {ing.inventoryItem.name || 'Unknown Item'}
                      </span>
                      <span className="font-black text-slate-800">
                        {ing.quantityRequired} {ing.unit}
                      </span>
                    </div>
                  ))}
                  {(!item.ingredients || item.ingredients.length === 0) && (
                    <p className="text-xs text-slate-400 font-medium italic">No ingredients linked yet.</p>
                  )}
                </div>
              </div>

              {/* Customizations */}
              <div className="p-8 backdrop-blur-xl bg-white/30 rounded-[2.5rem] border border-white/50 shadow-xl">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600" /> Extras
                </h3>
                <div className="space-y-4">
                  {item.customizationOptions?.map((opt, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-white/40 border border-white/60 rounded-2xl">
                      <div>
                        <p className="font-black text-slate-800 text-xs uppercase">{opt.optionName}</p>
                        {opt.isMandatory && <span className="text-[8px] font-black text-rose-500 tracking-tighter">REQUIRED</span>}
                      </div>
                      <p className="font-black text-indigo-600 text-sm">+{opt.price}</p>
                    </div>
                  ))}
                  {(!item.customizationOptions || item.customizationOptions.length === 0) && (
                    <p className="text-xs text-slate-400 font-medium italic">No customizations configured.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/20 backdrop-blur-md transition-all">
          <div className="absolute inset-0" onClick={closeModal} />
          <Card 
            variant="elevated" 
            className="w-full max-w-2xl bg-white/95 backdrop-blur-3xl shadow-2xl relative animate-in fade-in zoom-in duration-300 rounded-[3rem] border-none"
          >
            <button 
              onClick={closeModal} 
              className="absolute right-8 top-8 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all z-10"
            >
              <X size={22} />
            </button>
            <div className="p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <MenuItemForm itemToEdit={selectedItem} onClose={closeModal} />
            </div>
          </Card>
        </div>
      )}
      <RecipeBuilderModal
              isOpen={!!recipeItem}
              onClose={() => setRecipeItem(null)}
              menuItem={recipeItem}
      />
      {showPriceCalc && (
        <PriceCalculatorModal
          isOpen={showPriceCalc}
          onClose={() => setShowPriceCalc(false)}
          menuItemId={item._id}
          menuItemName={item.name}
          currentPrice={item.price}
          onPriceApplied={(newPrice) => {
            dispatch(fetchMenuItemById(id)); 
          }}
        />
      )}
    </div>
  );
};

const GlassStatsCard = ({ label, value, icon }) => (
  <Card className="flex group backdrop-blur-xl bg-white/30 border border-white/50 shadow-lg transition-all hover:scale-105 hover:bg-white/50 items-center gap-4 py-6 border-none rounded-[1.5rem] bg-white hover:-translate-y-1">
    <div className="p-4 bg-slate-50 rounded-2xl shadow-inner">{icon}</div>
    <div>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  </Card>
);



export default MenuItemDetailPage;
