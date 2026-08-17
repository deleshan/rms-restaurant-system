import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  X, Upload, Download, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Redux Actions & Selectors
import { clearInventoryStatus } from '@/features/inventory/inventorySlice';
import { 
  bulkUploadInventory, 
  logPurchaseCSV, 
  downloadInventoryTemplate,
  confirmUSDAMatch   
} from '@/features/inventory/inventoryThunks';
import { 
  selectInventorySuccessMessage, 
  selectInventoryError 
} from '@/features/inventory/inventorySelector';

// UI Components
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// BulkUploadModal

 
const BulkUploadModal = ({ isOpen, onClose, isUploading, mode = 'import' }) => {
  const dispatch = useDispatch();
  
  // Local State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewStep, setReviewStep]   = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [supplier, setSupplier] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Redux Selectors
  const success = useSelector(selectInventorySuccessMessage);
  const error = useSelector(selectInventoryError);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setIsDragging(false);
      setReviewStep(false);  
      setReviewItems([]); 
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // FILE HANDLING LOGIC 
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "text/csv" || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      dispatch(clearInventoryStatus());
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      dispatch(clearInventoryStatus());
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    if (isPurchase) {
      formData.append('paymentStatus', paymentStatus);
      formData.append('supplier', supplier || 'Unknown Supplier');
      if (paymentStatus === 'Unpaid' && dueDate) formData.append('dueDate', dueDate);
      await dispatch(logPurchaseCSV(formData));
    } else {
      const result = await dispatch(bulkUploadInventory(formData));
      if (!isPurchase && result.payload?.needsReview?.length > 0) {
        setReviewItems(result.payload.needsReview);
        setReviewStep(true);
      }
    }
  };


  // UI Theme based on mode
  const isPurchase = mode === 'purchase';
  const themeColor = isPurchase ? "text-emerald-600" : "text-indigo-600";
  const themeBg = isPurchase ? "bg-emerald-500" : "bg-indigo-600";
  const themeBorder = isPurchase ? "border-emerald-500" : "border-indigo-500";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/*  HEADER  */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              {isPurchase ? 'Log Purchase' : 'Bulk Import'}
            </h2>
            
            <button 
              onClick={() => dispatch(downloadInventoryTemplate(mode))}
              className={cn(
                "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:opacity-70",
                themeColor
              )}
            >
              <Download size={14} />
              Get {isPurchase ? 'Purchase' : 'Import'} Template
            </button>
            
            <p className="text-slate-500 text-sm font-medium pt-2 italic">
              {isPurchase 
                ? 'Increment stock levels for existing SKUs.' 
                : 'Register new inventory assets to the system.'}
            </p>
            <p className="text-[11px] text-amber-600 font-bold pt-2 flex items-start gap-1.5">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              {isPurchase 
                ? 'Make sure the "unit" column matches what your Quantity/unitPrice are quoted in (e.g. kg vs g) — it will be auto-converted to match the item\'s stocking unit.'
                : 'The "unit" column sets this item\'s permanent stocking unit (e.g. kg, g, ml, l).'}
            </p>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="text-slate-400" />
          </button>
        </div>

        {/*  FEEDBACK MESSAGES  */}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <p className="text-sm font-bold text-emerald-900">
                {typeof success === 'object' ? success.message : success}
              </p>
            </div>
            {/* Show skipped names if any */}
            {success?.skippedNames?.length > 0 && (
              <p className="text-xs text-amber-600 font-bold mt-1 ml-7">
                Already existed: {success.skippedNames.join(', ')}
              </p>
            )}
          </div>
        )}
        {success?.unitMismatches?.length > 0 && (
          <div className="mt-3 ml-7 space-y-1">
            <p className="text-xs font-bold text-amber-700">Unit conversions applied:</p>
            {success.unitMismatches.map((m, i) => (
              <p key={i} className="text-[11px] text-slate-500">
                {m.name}: {m.csvUnit} → {m.itemUnit} (price adjusted to {m.convertedPrice}/{m.itemUnit})
              </p>
            ))}
          </div>
        )}

        {success?.newItemsCreated?.length > 0 && (
          <div className="mt-3 ml-7 space-y-1">
            <p className="text-xs font-bold text-indigo-700">New items created from this purchase:</p>
            {success.newItemsCreated.map((n, i) => (
              <p key={i} className="text-[11px] text-slate-500">
                {n.name} ({n.sku}) {n.matchedFromUSDA ? '— matched via USDA' : '— no USDA match, added manually'}
              </p>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-in shake-in">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {isPurchase && !success && !reviewStep && (
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Supplier</label>
              <input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Fresh Produce Co."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-sm"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid (Bill Later)</option>
              </select>
            </div>
            {paymentStatus === 'Unpaid' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 font-bold text-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* DROPZONE */}
        <div className="space-y-6">
          {!success && !reviewStep && (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csvInput').click()}
              className={cn(
                "border-4 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center transition-all cursor-pointer group",
                isDragging ? `${themeBorder} bg-slate-50 scale-[1.02]` : 
                selectedFile ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
              )}
            >
              <input 
                id="csvInput" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange} 
              />
              
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                isDragging || selectedFile ? `${themeBg} text-white shadow-lg` : "bg-white text-slate-400 shadow-sm group-hover:scale-110"
              )}>
                {selectedFile ? <CheckCircle2 size={28} /> : <Upload size={28} />}
              </div>
              
              <p className="font-bold text-slate-600 text-center uppercase text-[10px] tracking-[0.2em]">
                {selectedFile ? selectedFile.name : "Drop CSV or Click to Browse"}
              </p>
            </div>
          )}

          {reviewStep && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs font-black uppercase tracking-widest text-amber-600">
              {reviewItems.length} items need review
            </p>
            {reviewItems.map((ri, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <p className="font-bold text-slate-800">{ri.csvRow.name}</p>
                {ri.suggestions.length === 0 ? (
                  <p className="text-xs text-slate-400">No USDA match found — will be saved as-is.</p>
                ) : (
                  ri.suggestions.map(sug => (
                    <div key={sug.fdcId} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{sug.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {sug.category} · {Math.round(sug.score * 100)}% match
                        </p>
                      </div>
                      <Button
                        variant="white"
                        className="h-8 px-3 text-xs rounded-xl text-emerald-600 border-emerald-200"
                        onClick={() => dispatch(confirmUSDAMatch({
                          csvRow: ri.csvRow,
                          fdcId: sug.fdcId,
                          nutrients: sug.nutrients,
                          category: sug.category
                        }))}
                      >
                        Confirm
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ))}
            <Button variant="white" fullWidth onClick={() => { setReviewStep(false); onClose(); }}
              className="rounded-2xl h-12 font-black uppercase text-xs border-slate-100">
              Done
            </Button>
          </div>
        )}

          {/*  ACTIONS  */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="white" 
              fullWidth 
              onClick={onClose} 
              className="rounded-2xl h-14 font-black uppercase tracking-widest text-xs border-slate-100"
            >
              {success ? "Finish" : "Cancel"}
            </Button>
            
            {!success && (
              <Button 
                variant={isPurchase ? 'success' : 'primary'} 
                fullWidth 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
                className="rounded-2xl h-14 font-black uppercase tracking-widest text-xs shadow-lg"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>Syncing...</span>
                  </div>
                ) : (
                  "Start Upload"
                )}
              </Button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default BulkUploadModal;