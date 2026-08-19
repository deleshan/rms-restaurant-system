import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Upload, Download, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { bulkUploadInventory, downloadInventoryTemplate, confirmUSDAMatch } from '@/features/inventory/inventoryThunks';
import Button from '@/components/common/Button';

const OpeningInventoryStep = ({ addedCount, onValueAdded }) => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [needsReview, setNeedsReview] = useState([]);
  const [lastMessage, setLastMessage] = useState('');
  const [skippedNames, setSkippedNames] = useState([]);
  const [ledgerWarning, setLedgerWarning] = useState('');
  const [error, setError] = useState('');

  const handleFile = (file) => {
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setError('');
      setLastMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setLedgerWarning('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('isInitialSetup', 'true');

    const result = await dispatch(bulkUploadInventory(formData));
    setUploading(false);

    if (result.type.endsWith('/rejected')) {
      setError(result.payload || 'Upload failed');
      return;
    }

    const payload = result.payload;
    setSelectedFile(null);
    setLastMessage(payload?.message || '');
    setSkippedNames(payload?.skippedNames || []);
    if (payload?.ledgerWarning) setLedgerWarning(payload.ledgerWarning);
    if (payload?.openingValueAdded) onValueAdded(payload.openingValueAdded, payload.autoImported || 0);
    if (payload?.needsReview?.length > 0) setNeedsReview(payload.needsReview);
  };

  const handleConfirmMatch = async (ri, sug) => {
    const result = await dispatch(confirmUSDAMatch({
      csvRow: ri.csvRow, fdcId: sug.fdcId, nutrients: sug.nutrients, category: sug.category,
      isInitialSetup: true,
    }));
    if (!result.type.endsWith('/rejected')) {
      if (result.payload?.ledgerWarning) setLedgerWarning(result.payload.ledgerWarning);
      if (result.payload?.valueAdded) onValueAdded(result.payload.valueAdded, 1);
      setNeedsReview((prev) => prev.filter((r) => r !== ri));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => dispatch(downloadInventoryTemplate('import'))}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 hover:opacity-70"
        >
          <Download size={14} /> Get Import Template
        </button>
        {addedCount > 0 && (
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={12} /> {addedCount} item(s) added so far
          </span>
        )}
      </div>

      <p className="text-xs text-amber-600 font-bold flex items-start gap-1.5">
        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
        The "unit" column sets each item's permanent stocking unit. Names are auto-matched against the USDA food database, same as regular Bulk Import.
      </p>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-3">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {lastMessage && !needsReview.length && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
          <CheckCircle2 className="text-emerald-500" size={18} />
          <p className="text-sm font-bold text-emerald-900">{lastMessage}</p>
        </div>
      )}

      {needsReview.length > 0 ? (
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600">
            {needsReview.length} item(s) need review
          </p>
          {needsReview.map((ri, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl p-4 space-y-3">
              <p className="font-bold text-slate-800">{ri.csvRow.name}</p>
              {ri.suggestions.length === 0 ? (
                <p className="text-xs text-slate-400">No USDA match found — you can still confirm as-is.</p>
              ) : (
                ri.suggestions.map((sug) => (
                  <div key={sug.fdcId} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{sug.description}</p>
                      <p className="text-[10px] text-slate-400">{sug.category} · {Math.round(sug.score * 100)}% match</p>
                    </div>
                    <Button
                      variant="white"
                      className="h-8 px-3 text-xs rounded-xl text-emerald-600 border-emerald-200"
                      onClick={() => handleConfirmMatch(ri, sug)}
                    >
                      Confirm
                    </Button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
          onClick={() => document.getElementById('openingCsvInput').click()}
          className={`border-4 border-dashed rounded-[2.5rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging ? 'border-indigo-400 bg-slate-50' : selectedFile ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
          }`}
        >
          <input id="openingCsvInput" type="file" accept=".csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-3 ${selectedFile ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
            {selectedFile ? <CheckCircle2 size={24} /> : <Upload size={24} />}
          </div>
          <p className="font-bold text-slate-600 text-center uppercase text-[10px] tracking-[0.2em]">
            {selectedFile ? selectedFile.name : 'Drop CSV or Click to Browse'}
          </p>
        </div>
      )}

      {!needsReview.length && (
        <Button
          variant="primary" fullWidth disabled={!selectedFile || uploading}
          onClick={handleUpload}
          className="rounded-2xl h-14 font-black uppercase tracking-widest text-xs"
        >
          {uploading ? 'Uploading…' : 'Upload & Match'}
        </Button>
      )}
      {lastMessage && !needsReview.length && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
          <CheckCircle2 className="text-emerald-500" size={18} />
          <p className="text-sm font-bold text-emerald-900">{lastMessage}</p>
        </div>
      )}
      {skippedNames.length > 0 && !needsReview.length && (
        <p className="text-xs text-amber-600 font-bold ml-1">
          Already existed: {skippedNames.join(', ')}
        </p>
      )}
      {ledgerWarning && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {ledgerWarning}
        </div>
      )}

      <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
        <Package size={14} /> You can upload multiple CSVs — each import adds to your opening inventory total.
      </p>
    </div>
  );
};

export default OpeningInventoryStep;