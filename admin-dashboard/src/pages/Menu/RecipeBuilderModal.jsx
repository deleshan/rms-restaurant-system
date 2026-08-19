import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, ChefHat, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { updateMenuItemIngredients } from '@/features/menu/menuThunks';
import { fetchInventoryItems } from '@/features/inventory/inventoryThunks';
import { selectAllMenuItems } from '@/features/menu/menuSelector';
import { selectFilteredInventory } from '@/features/inventory/inventorySelector';
import { clearMenuStatus } from '@/features/menu/menuSlice';
import Button from '@/components/common/Button';
import Select from '@/components/ui/Select';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { cn } from '@/utils/cn';

const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'cup'];

const RecipeBuilderModal = ({ isOpen, onClose, menuItem }) => {
  const dispatch = useDispatch();

  const inventoryItems = useSelector((state) =>
    selectFilteredInventory(state, '', 'all')
  );
  const loading = useSelector((state) => state.menu.loading);
  const success = useSelector((state) => state.menu.successMessage);
  const error = useSelector((state) => state.menu.error);

  const [ingredients, setIngredients] = useState([]);
  const [customizations, setCustomizations] = useState([]);

  // Seed form with existing recipe on open
  useEffect(() => {
    if (isOpen && menuItem) {
      setIngredients(
        (menuItem.ingredients || []).map((ing) => ({
          inventoryItem: ing.inventoryItem?._id || ing.inventoryItem || '',
          quantityRequired: ing.quantityRequired || '',
          unit: ing.unit || 'g',
          isOptional: ing.isOptional || false,
        }))
      );
      setCustomizations(
        (menuItem.customizationOptions || []).map((opt) => ({
          optionName: opt.optionName || '',
          price: opt.price || 0,
          type: opt.type || 'ADD',
          isMandatory: opt.isMandatory || false,
          ingredientEffects: (opt.ingredientEffects || []).map((eff) => ({
            inventoryItem: eff.inventoryItem?._id || eff.inventoryItem || '',
            quantityDelta: eff.quantityDelta || '',
            unit: eff.unit || 'g',
          })),
        }))
      );
    }
  }, [isOpen, menuItem]);

  useEffect(() => {
    if (isOpen) dispatch(fetchInventoryItems({ page: 1, limit: 200 }));
  }, [isOpen, dispatch]);

  // Auto-close on success after delay
  useEffect(() => {
    if (success === 'Recipe updated successfully') {
      const t = setTimeout(() => {
        dispatch(clearMenuStatus());
        onClose();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [success, dispatch, onClose]);

  if (!isOpen || !menuItem) return null;

  // Ingredient Handlers
  const addIngredient = () =>
    setIngredients((prev) => [...prev, { inventoryItem: '', quantityRequired: '', unit: 'g', isOptional: false }]);

  const removeIngredient = (i) =>
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  const updateIngredient = (index, field, value) =>
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );

  // Customization Handlers
  const addCustomization = () =>
    setCustomizations((prev) => [...prev, { optionName: '', price: 0, type: 'ADD', isMandatory: false, ingredientEffects: [] }]);

  const removeCustomization = (i) =>
    setCustomizations((prev) => prev.filter((_, idx) => idx !== i));

  const updateCustomization = (index, field, value) =>
    setCustomizations((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );

  const addEffect = (custIndex) =>
    setCustomizations((prev) =>
      prev.map((c, i) =>
        i === custIndex
          ? { ...c, ingredientEffects: [...c.ingredientEffects, { inventoryItem: '', quantityDelta: '', unit: 'g' }] }
          : c
      )
    );

  const updateEffect = (custIndex, effIndex, field, value) =>
    setCustomizations((prev) =>
      prev.map((c, i) =>
        i === custIndex
          ? {
              ...c,
              ingredientEffects: c.ingredientEffects.map((e, j) =>
                j === effIndex ? { ...e, [field]: value } : e
              ),
            }
          : c
      )
    );

  const removeEffect = (custIndex, effIndex) =>
    setCustomizations((prev) =>
      prev.map((c, i) =>
        i === custIndex
          ? { ...c, ingredientEffects: c.ingredientEffects.filter((_, j) => j !== effIndex) }
          : c
      )
    );

  const handleSave = () => {
    const validIngredients = ingredients.filter((i) => i.inventoryItem && i.quantityRequired > 0);
    dispatch(
      updateMenuItemIngredients({
        id: menuItem._id || menuItem.id,
        ingredients: validIngredients,
        customizationOptions: customizations,
      })
    );
  };

  const inventoryOptions = inventoryItems.map((item) => ({
    value: item._id || item.id,
    label: `${item.name} (${item.currentStock} ${item.unit})`,
  }));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-8 pt-8 pb-4 border-b border-slate-100 rounded-t-[2.5rem] z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <ChefHat size={20} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Recipe Builder
                </h2>
              </div>
              <p className="text-slate-500 text-sm font-medium ml-11">
                {menuItem.name} — link ingredients for auto inventory deduction
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="text-slate-400" size={20} />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">

          {/* Feedback */}
          {success === 'Recipe updated successfully' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <p className="text-sm font-bold text-emerald-800">Recipe saved successfully!</p>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="text-rose-500" size={18} />
              <p className="text-sm font-bold text-rose-800">{error}</p>
            </div>
          )}

          {/* Base Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                  Base Ingredients
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Deducted from stock on every order of this item
                </p>
              </div>
              <Button
                variant="white"
                icon={Plus}
                onClick={addIngredient}
                className="rounded-xl h-9 px-4 text-xs font-bold border-slate-200 text-indigo-600"
              >
                Add
              </Button>
            </div>

            {ingredients.length === 0 ? (
              <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No ingredients yet — click Add to start building the recipe
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4">
                    
                    {/* Inventory Item Select */}
                    <div className="flex-1">
                      <SearchableSelect
                        value={ing.inventoryItem}
                        onChange={(val) => updateIngredient(idx, 'inventoryItem', val)}
                        options={inventoryOptions}
                        placeholder="— Select ingredient —"
                        className="h-10 text-sm"
                      />
                    </div>

                    {/* Quantity */}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Qty"
                      value={ing.quantityRequired}
                      onChange={(e) => updateIngredient(idx, 'quantityRequired', parseFloat(e.target.value) || '')}
                      className="w-20 h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />

                    {/* Unit */}
                    <select
                      value={ing.unit}
                      onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                      className="h-10 px-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>

                    {/* Optional toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={ing.isOptional}
                        onChange={(e) => updateIngredient(idx, 'isOptional', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Opt</span>
                    </label>

                    <button onClick={() => removeIngredient(idx)} className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={15} className="text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customization Options Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">
                  Customization Effects
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  How each customer option affects ingredient stock
                </p>
              </div>
              <Button
                variant="white"
                icon={Plus}
                onClick={addCustomization}
                className="rounded-xl h-9 px-4 text-xs font-bold border-slate-200 text-emerald-600"
              >
                Add Option
              </Button>
            </div>

            {customizations.length === 0 ? (
              <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  No customizations — add options like "Extra Cheese" or "No Onions"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customizations.map((cust, cIdx) => (
                  <div key={cIdx} className="border border-slate-200 rounded-2xl p-5 space-y-4">
                    
                    {/* Customization Header Row */}
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Option name (e.g. Extra Cheese)"
                        value={cust.optionName}
                        onChange={(e) => updateCustomization(cIdx, 'optionName', e.target.value)}
                        className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                      <select
                        value={cust.type}
                        onChange={(e) => updateCustomization(cIdx, 'type', e.target.value)}
                        className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none"
                      >
                        <option value="ADD">ADD</option>
                        <option value="REMOVE">REMOVE</option>
                        <option value="SWAP">SWAP</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={cust.price}
                        onChange={(e) => updateCustomization(cIdx, 'price', parseFloat(e.target.value) || 0)}
                        className="w-20 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none"
                      />
                      <button onClick={() => removeCustomization(cIdx)} className="p-1.5 hover:bg-rose-50 rounded-lg">
                        <Trash2 size={15} className="text-rose-400" />
                      </button>
                    </div>

                    {/* Ingredient Effects for this customization */}
                    <div className="pl-4 border-l-2 border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Ingredient Effects
                        </p>
                        <button
                          onClick={() => addEffect(cIdx)}
                          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:opacity-70 flex items-center gap-1"
                        >
                          <Plus size={11} /> Add Effect
                        </button>
                      </div>

                      {cust.ingredientEffects.map((eff, eIdx) => (
                        <div key={eIdx} className="flex items-center gap-2">
                          <div className="flex-1">
                            <SearchableSelect
                              value={eff.inventoryItem}
                              onChange={(val) => updateEffect(cIdx, eIdx, 'inventoryItem', val)}
                              options={inventoryOptions}
                              placeholder="— Select —"
                              className="h-9 text-xs"
                            />
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Δ qty"
                            value={eff.quantityDelta}
                            onChange={(e) => updateEffect(cIdx, eIdx, 'quantityDelta', parseFloat(e.target.value) || '')}
                            className="w-20 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none"
                          />
                          <select
                            value={eff.unit}
                            onChange={(e) => updateEffect(cIdx, eIdx, 'unit', e.target.value)}
                            className="h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                          >
                            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                          <button onClick={() => removeEffect(cIdx, eIdx)} className="p-1 hover:bg-rose-50 rounded-lg">
                            <X size={13} className="text-rose-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm px-8 py-6 border-t border-slate-100 rounded-b-[2.5rem]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} · {customizations.length} option{customizations.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <Button variant="white" onClick={onClose} className="rounded-xl h-11 px-6 font-bold border-slate-200">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl h-11 px-8 font-black shadow-lg shadow-indigo-200"
              >
                {loading ? 'Saving...' : 'Save Recipe'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeBuilderModal;