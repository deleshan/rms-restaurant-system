import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as XLSX from 'xlsx';
import { createMenuItem, updateMenuItem, bulkUploadMenuItems } from '@/features/menu/menuThunks';
import Button from '@/components/common/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { 
  X, Plus, Trash2, Leaf, Flame, Ban, Upload, 
  Package, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Info
} from 'lucide-react';

import { selectMenuLoading, selectMenuError } from '@/features/menu/menuSelector';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const MenuItemForm = ({ itemToEdit, onClose }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const bulkFileInputRef = useRef(null);
  const isEditMode = !!itemToEdit;
  const isLoading = useSelector(selectMenuLoading);
  const serverError = useSelector(selectMenuError);

  const [preview, setPreview] = useState(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isBulkDragging, setIsBulkDragging] = useState(false);
  
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkData, setBulkData] = useState([]);
  const [status, setStatus] = useState({ type: null, message: '' }); // 'success' | 'error' | 'info'

  const initialFormState = {
    name: '',
    description: '',
    price: '',
    category: '',
    station: 'Hot Station',
    image: '',
    isAvailable: true,
    stockLevel: 0,
    dietary: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isSpicy: false,
      calories: '',
    },
    customizable: false,
    customizationOptions: [],
    ingredients: [],
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        ...initialFormState,
        ...itemToEdit,
        price: itemToEdit.price || '',
        dietary: { ...initialFormState.dietary, ...itemToEdit.dietary },
        customizationOptions: itemToEdit.customizationOptions || [],
        ingredients: itemToEdit.ingredients || [],
      });
      if (itemToEdit.image) setPreview(itemToEdit.image);
    }
  }, [itemToEdit]);

  const processImageFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrag = (e, setter) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setter(true);
    if (e.type === 'dragleave') setter(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        name: 'Cheese Burger',
        description: 'Delicious beef burger with cheddar',
        price: 1200,
        category: 'Main Course',
        station: 'Hot Station',
        stockLevel: 50,
        calories: 550,
        isVegetarian: 'FALSE',
        isVegan: 'FALSE',
        isGlutenFree: 'FALSE',
        isSpicy: 'FALSE',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MenuTemplate');
    XLSX.writeFile(workbook, 'Restaurant_Menu_Template.xlsx');
  };

  const VALID_STATIONS = ['Hot Station', 'Cold Station', 'Bar / Drinks'];

  const processBulkFile = (file) => {
    if (!file) return;
    setBulkFile(file);
    setStatus({ type: null, message: '' });

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target.result;
        const wb = XLSX.read(buffer, { type: 'array' }); 
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          setStatus({ type: 'error', message: 'The spreadsheet appears to be empty.' });
          return;
        }

        const formattedItems = data.map((item) => ({
          name: item.name || 'Unnamed Item',
          description: item.description || '',
          price: parseFloat(item.price) || 0,
          category: item.category || 'Uncategorized',
          station: VALID_STATIONS.includes(item.station) ? item.station : 'Hot Station',
          stockLevel: parseInt(item.stockLevel, 10) || 0,
          dietary: {
            isVegetarian: String(item.isVegetarian || '').trim().toLowerCase() === 'true',
            isVegan: String(item.isVegan || '').trim().toLowerCase() === 'true',
            isGlutenFree: String(item.isGlutenFree || '').trim().toLowerCase() === 'true',
            isSpicy: String(item.isSpicy || '').trim().toLowerCase() === 'true',
            calories: parseInt(item.calories, 10) || 0,
          },
          isAvailable: true,
        }));

        setBulkData(formattedItems);
        setStatus({ 
          type: 'info', 
          message: `Successfully parsed ${formattedItems.length} items. Click proceed to upload.` 
        });
      } catch (err) {
        console.error('XLSX Parsing Error:', err);
        setStatus({ 
          type: 'error', 
          message: 'Failed to parse file. Please check the file formatting and try again.' 
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkData.length === 0) return;
    try {
      await dispatch(bulkUploadMenuItems(bulkData)).unwrap();
      setStatus({ type: 'success', message: `All ${bulkData.length} items synced successfully!` });
      setTimeout(() => onClose(), 2000); 
    } catch (err) {
      setStatus({ type: 'error', message: err || 'Server error during bulk upload.' });
    }
  };

  const handleDietaryChange = (field) => {
    setFormData((prev) => ({
      ...prev,
      dietary: { ...prev.dietary, [field]: !prev.dietary[field] },
    }));
  };

  const updateListField = (listName, index, field, value) => {
    setFormData((prev) => {
      const newList = [...prev[listName]];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [listName]: newList };
    });
  };

  const removeFromList = (listName, index) => {
    setFormData((prev) => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: '' });
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      stockLevel: parseInt(formData.stockLevel),
      dietary: { ...formData.dietary, calories: parseInt(formData.dietary.calories) || 0 }
    };

    try {
      if (isEditMode) {
        await dispatch(updateMenuItem({ id: itemToEdit._id, ...payload })).unwrap();
      } else {
        await dispatch(createMenuItem(payload)).unwrap();
      }
      onClose();
    } catch (err) {
      setStatus({ type: 'error', message: err || 'Something went wrong.' });
    }
  };

  return (
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4 top-0 bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100 z-20 ">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEditMode ? 'Modify Menu Item' : isBulkMode ? 'Bulk Sheet Sync' : 'New Menu Entry'}
          </h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
            {isEditMode ? `ID: ${itemToEdit._id.slice(-6)}` : 'Inventory Management'}
          </p>
        </div>
        {!isEditMode && (
          <Button
            type="button"
            variant={isBulkMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setIsBulkMode(!isBulkMode);
              setStatus({ type: null, message: '' });
              setBulkFile(null);
            }}
            className="rounded-full px-5 transition-all active:scale-95"
          >
            {isBulkMode ? <><Plus size={16} className="mr-2" /> Manual Mode</> : <><FileSpreadsheet size={16} className="mr-2" /> Excel Sync</>}
          </Button>
        )}
      </div>

      {/* Inline Feedback Banner */}
      {status.message && (
        <div className={cn(
          "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          status.type === 'error' ? "bg-red-50 text-red-700 border border-red-100" :
          status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
          "bg-blue-50 text-blue-700 border border-blue-100"
        )}>
          {status.type === 'error' ? <AlertTriangle size={20} /> : status.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />}
          <p className="text-sm font-bold">{status.message}</p>
        </div>
      )}

      {isBulkMode ? (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsBulkDragging(true); }}
            onDragLeave={() => setIsBulkDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsBulkDragging(false); processBulkFile(e.dataTransfer.files[0]); }}
            onClick={() => bulkFileInputRef.current.click()}
            className={cn(
              "border-4 border-dashed rounded-[2.5rem] p-16 flex flex-col items-center justify-center transition-all cursor-pointer group",
              isBulkDragging ? "border-indigo-500 bg-indigo-50 scale-[1.02]" : 
              bulkFile ? "border-emerald-500 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
            )}
          >
            <input type="file" ref={bulkFileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => processBulkFile(e.target.files[0])} />
            
            <div className={cn(
              "h-20 w-20 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-300",
              bulkFile ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-white text-indigo-500 shadow-xl group-hover:scale-110"
            )}>
              {bulkFile ? <CheckCircle2 size={32} /> : <FileSpreadsheet size={32} />}
            </div>
            
            <p className="font-black text-slate-700 text-center uppercase text-xs tracking-[0.2em]">
              {bulkFile ? bulkFile.name : "Drop Excel / CSV or Click to Browse"}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-center">
              <button type="button" onClick={downloadTemplate} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 hover:opacity-70 transition-all">
                <Download size={14} /> Download CSV Template
              </button>
            </div>

            {bulkData.length > 0 && status.type !== 'success' && (
              <div className="pt-4 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="primary" 
                  className="w-full py-6 rounded-2xl shadow-xl font-bold uppercase tracking-widest"
                  onClick={handleBulkSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : `Proceed & Sync ${bulkData.length} Items`}
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-300">
          {/* Image Upload Area */}
          <div
            onDragOver={(e) => handleDrag(e, setIsDragging)}
            onDragLeave={(e) => handleDrag(e, setIsDragging)}
            onDrop={(e) => {
              handleDrag(e, setIsDragging);
              processImageFile(e.dataTransfer.files[0]);
            }}
            className={`group relative border-2 border-dashed rounded-3xl overflow-hidden aspect-video max-h-64 flex items-center justify-center transition-all
              ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-indigo-200'}
            `}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button type="button" variant="danger" size="sm" onClick={() => setPreview(null)}>Remove Image</Button>
                </div>
              </>
            ) : (
              <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mx-auto text-gray-400 group-hover:text-indigo-500 mb-2" size={32} />
                <p className="text-sm font-medium text-gray-500">Drag dish photo here</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => processImageFile(e.target.files[0])} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Category</label>
              <select className="bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required>
                <option value="">Select Category</option>
                {['Main Course', 'Beverages', 'Desserts', 'Appetizers', 'Sides'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Kitchen Station</label>
              <select
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none"
                value={formData.station}
                onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                required
              >
                <option value="Hot Station">Hot Station</option>
                <option value="Cold Station">Cold Station</option>
                <option value="Bar / Drinks">Bar / Drinks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Price (LKR)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
            <Input label="Stock Level" type="number" value={formData.stockLevel} onChange={(e) => setFormData({ ...formData, stockLevel: e.target.value })} />
            <Input label="Calories" type="number" value={formData.dietary.calories} onChange={(e) => setFormData({ ...formData, dietary: { ...formData.dietary, calories: e.target.value } })} />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'isVegetarian', label: 'Vegetarian', icon: <Leaf size={14} />, color: 'text-green-600', bg: 'bg-green-50' },
              { id: 'isVegan', label: 'Vegan', icon: <Leaf size={14} />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
              { id: 'isSpicy', label: 'Spicy', icon: <Flame size={14} />, color: 'text-red-600', bg: 'bg-red-50' },
              { id: 'isGlutenFree', label: 'Gluten Free', icon: <Ban size={14} />, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(tag => (
              <button key={tag.id} type="button" onClick={() => handleDietaryChange(tag.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all
                  ${formData.dietary[tag.id] ? `${tag.bg} border-current ${tag.color}` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}
                `}
              >
                {tag.icon} {tag.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea 
                className="w-full border rounded-2xl p-2 h-20 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Brief description of the dish..."
              />
            </div>
            

            <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-bold text-indigo-900 uppercase">Extra Add-ons</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData(prev => ({ ...prev, customizable: true, customizationOptions: [...prev.customizationOptions, { optionName: '', price: 0, isMandatory: false }] }))}>+ Add</Button>
              </div>
              {formData.customizationOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-2xl mb-2 shadow-sm">
                  <Input placeholder="Option" className="flex-1" value={opt.optionName} onChange={(e) => updateListField('customizationOptions', idx, 'optionName', e.target.value)} />
                  <Input type="number" placeholder="Price" className="w-24" value={opt.price} onChange={(e) => updateListField('customizationOptions', idx, 'price', e.target.value)} />
                  <button type="button" onClick={() => removeFromList('customizationOptions', idx)} className="text-red-300 hover:text-red-500 px-2"><X size={20} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 sticky bottom-0 backdrop-blur-md pt-4 border-t bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isLoading} className="px-8 shadow-lg shadow-indigo-200">
              {isLoading ? <LoadingSpinner size="sm" /> : isEditMode ? 'Update Dish' : 'Add to Menu'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MenuItemForm;