import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Download,
  Eye,
  Wrench,
  Search,
  TrendingDown,
  DollarSign,
  X,
  ChevronRight,
  BarChart2,
  PackagePlus,
  Landmark,
  CalendarClock,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Thunks & Selectors
import { fetchAssets, purchaseAsset, sellAsset, exportFinanceReport } from '@/features/finance/financeThunks';
import {
  selectAssets,
  selectFinanceLoading,
  selectFinanceError,
} from '@/features/finance/financeSelector';

// UI Components
import DataTable from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';


// CONSTANTS
const ASSET_TYPES = [
  { value: 'Vehicle',           label: 'Vehicle',           depreciable: true },
  { value: 'Equipment & Tools', label: 'Equipment & Tools', depreciable: true },
  { value: 'Furniture',         label: 'Furniture',         depreciable: true },
  { value: 'Machinery',         label: 'Machinery',         depreciable: true },
  { value: 'Building',          label: 'Building',          depreciable: true },
  { value: 'Land',              label: 'Land',              depreciable: false },
];

const DEPRECIATION_METHODS = [
  { value: 'straight-line',      label: 'Straight-Line (SL)'        },
  { value: 'declining-balance',  label: 'Declining Balance (DB)'     },
];

const DEFAULT_USEFUL_LIVES = {
  'Vehicle':           20,
  'Equipment & Tools': 5,
  'Furniture':         7,
  'Machinery':         10,
  'Building':          40,
  'Land':              null,
};


// HELPERS

// Build a year-by-year SL or DB depreciation schedule 
const buildDepreciationSchedule = (asset) => {
  if (!asset || asset.assetType === 'Land') return [];
  const cost       = asset.purchaseCost   || 0;
  const usefulLife = asset.usefulLife     || DEFAULT_USEFUL_LIVES[asset.assetType] || 5;
  const method     = asset.depreciationMethod || 'straight-line';
  const purchaseYear = asset.purchaseDate
    ? new Date(asset.purchaseDate).getFullYear()
    : new Date().getFullYear();

  const schedule = [];
  let bookValue  = cost;
  const rate     = method === 'declining-balance' ? 2 / usefulLife : null;
  const annualSL = cost / usefulLife;

  for (let yr = 1; yr <= usefulLife; yr++) {
    const depreciation =
      method === 'declining-balance'
        ? +(bookValue * rate).toFixed(2)
        : +annualSL.toFixed(2);
    const closing = +(bookValue - depreciation).toFixed(2);
    schedule.push({
      year:         purchaseYear + yr - 1,
      opening:      +bookValue.toFixed(2),
      depreciation,
      closing:      closing < 0 ? 0 : closing,
    });
    bookValue = closing < 0 ? 0 : closing;
    if (bookValue === 0) break;
  }
  return schedule;
};

/** Annual depreciation shown in the table */
const getAnnualDepreciation = (asset) => {
  if (!asset || asset.assetType === 'Land') return null;
  const cost       = asset.purchaseCost || 0;
  const usefulLife = asset.usefulLife   || DEFAULT_USEFUL_LIVES[asset.assetType] || 5;
  const method     = asset.depreciationMethod || 'straight-line';
  if (method === 'declining-balance') {
    const rate = 2 / usefulLife;
    return +((asset.currentValue || cost) * rate).toFixed(2);
  }
  return +(cost / usefulLife).toFixed(2);
};


// INLINE MODAL SHELL  (no external Modal dep)
const ModalShell = ({ title, subtitle, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      className={`relative bg-white rounded-[2rem] shadow-2xl flex flex-col
        ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'}
        max-h-[90vh] overflow-hidden`}
    >
      <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 font-semibold mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-8 py-6">{children}</div>
    </div>
  </div>
);


// FIELD HELPERS
const FormRow = ({ label, required, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const NativeSelect = ({ value, onChange, options, placeholder, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700
      bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

const TextInput = ({ type = 'text', value, onChange, placeholder, min, className = '' }) => (
  <input
    type={type}
    value={value}
    min={min}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700
      placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700
      placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
  />
);

// PURCHASE / INITIAL ASSET MODAL
const PurchaseModal = ({ isInitial = false, onClose, onSubmit, loading }) => {
  const emptyForm = {
    name:               '',
    assetType:          '',
    purchaseDate:       new Date().toISOString().split('T')[0],
    purchaseCost:       '',
    usefulLife:         '',
    depreciationMethod: 'straight-line',
    currentValue:       '', 
    notes:              '',
  };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const selectedType  = ASSET_TYPES.find((t) => t.value === form.assetType);
  const isDepreciable = selectedType?.depreciable ?? true;
  const isLand        = form.assetType === 'Land';

  const set = (key) => (val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      // Auto-fill useful life default when type changes
      if (key === 'assetType') {
        next.usefulLife = DEFAULT_USEFUL_LIVES[val]?.toString() || '';
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Asset name is required';
    if (!form.assetType) e.assetType = 'Please select an asset type';
    if (!form.purchaseDate) e.purchaseDate = 'Purchase date is required';
    if (!form.purchaseCost || Number(form.purchaseCost) <= 0) e.purchaseCost = 'Enter a valid cost > 0';
    if (!isLand && (!form.usefulLife || Number(form.usefulLife) <= 0)) e.usefulLife  = 'Enter useful life in years';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({
      name: form.name.trim(),
      assetType: form.assetType,
      purchaseDate: form.purchaseDate,
      purchaseCost: Number(form.purchaseCost),
      usefulLife: isLand ? null : Number(form.usefulLife),
      depreciationMethod: isLand ? null : form.depreciationMethod,
      currentValue: isInitial && form.currentValue? Number(form.currentValue) : Number(form.purchaseCost),
      notes: form.notes.trim() || undefined,
      isInitial,
    });
  };

  return (
    <ModalShell
      title={isInitial ? 'Add Initial Long-Term Asset' : 'Purchase New Asset'}
      subtitle={
        isInitial
          ? 'Record existing assets at their current book value'
          : 'Record a new fixed asset acquisition'
      }
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* Name */}
        <FormRow label="Asset Name" required>
          <TextInput value={form.name} onChange={set('name')} placeholder="e.g. Commercial Oven, Dining Chair Set…" />
          {errors.name && <p className="text-[10px] text-rose-500">{errors.name}</p>}
        </FormRow>

        {/* Type */}
        <FormRow label="Asset Type" required>
          <NativeSelect
            value={form.assetType}
            onChange={set('assetType')}
            placeholder="Select type…"
            options={ASSET_TYPES}
          />
          {errors.assetType && <p className="text-[10px] text-rose-500">{errors.assetType}</p>}
        </FormRow>

        {/* Dates & Cost – 2-col grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Purchase / Acquisition Date" required>
            <TextInput type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
            {errors.purchaseDate && <p className="text-[10px] text-rose-500">{errors.purchaseDate}</p>}
          </FormRow>
          <FormRow label="Original Cost (Rs.)" required>
            <TextInput
              type="number"
              value={form.purchaseCost}
              onChange={set('purchaseCost')}
              placeholder="0.00"
              min="0"
            />
            {errors.purchaseCost && <p className="text-[10px] text-rose-500">{errors.purchaseCost}</p>}
          </FormRow>
        </div>

        {/* Initial: current book value */}
        {isInitial && (
          <FormRow
            label="Current Book Value (Rs.)"
            hint="If different from original cost — leave blank to use original cost"
          >
            <TextInput
              type="number"
              value={form.currentValue}
              onChange={set('currentValue')}
              placeholder="e.g. 850,000"
              min="0"
            />
          </FormRow>
        )}

        {/* Depreciation (not for Land) */}
        {!isLand && (
          <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/40 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
              Depreciation Settings
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="Useful Life (Years)" required>
                <TextInput
                  type="number"
                  value={form.usefulLife}
                  onChange={set('usefulLife')}
                  placeholder={DEFAULT_USEFUL_LIVES[form.assetType]?.toString() || '5'}
                  min="1"
                />
                {errors.usefulLife && <p className="text-[10px] text-rose-500">{errors.usefulLife}</p>}
              </FormRow>
              <FormRow label="Depreciation Method" required>
                <NativeSelect
                  value={form.depreciationMethod}
                  onChange={set('depreciationMethod')}
                  options={DEPRECIATION_METHODS}
                />
              </FormRow>
            </div>
            {form.purchaseCost && form.usefulLife && (
              <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-semibold">
                <TrendingDown size={13} />
                Annual depreciation (SL estimate):&nbsp;
                <strong>
                  Rs. {(Number(form.purchaseCost) / Number(form.usefulLife)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </strong>
              </div>
            )}
          </div>
        )}

        {isLand && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700 font-semibold">
            <AlertCircle size={14} />
            Land is a non-depreciable asset — no depreciation will be applied.
          </div>
        )}

        {/* Notes */}
        <FormRow label="Notes / Description">
          <Textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="Location, serial number, supplier, warranty info…"
          />
        </FormRow>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50
            text-white text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200"
        >
          {loading ? 'Recording…' : isInitial ? 'Add to Register' : 'Record Purchase'}
        </button>
      </div>
    </ModalShell>
  );
};


// SALE MODAL
const SaleModal = ({ asset, onClose, onSubmit, loading }) => {
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const bookValue = asset?.currentValue || 0;
  const salePriceN = Number(salePrice);
  const gainLoss = salePrice !== '' ? salePriceN - bookValue : null;
  const isGain = gainLoss !== null && gainLoss >= 0;

  const handleSubmit = () => {
    if (!salePrice || salePriceN < 0) { setError('Enter a valid sale price'); return; }
    if (!saleDate) { setError('Sale date is required'); return; }
    onSubmit({ salePrice: salePriceN, saleDate, notes: notes.trim() || undefined });
  };

  return (
    <ModalShell
      title={`Sell Asset`}
      subtitle={asset?.name}
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* Book value info card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Original Cost</p>
            <p className="text-lg font-black text-slate-900 mt-1">
              Rs. {asset?.purchaseCost?.toLocaleString()}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Current Book Value</p>
            <p className="text-lg font-black text-indigo-700 mt-1">
              Rs. {bookValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Gain / Loss Preview */}
        {gainLoss !== null && (
          <div
            className={`flex items-center justify-between px-5 py-3 rounded-2xl border font-bold text-sm
              ${isGain
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
          >
            <span>{isGain ? '📈 Gain on Disposal' : '📉 Loss on Disposal'}</span>
            <span className="font-black text-base">
              Rs. {Math.abs(gainLoss).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Sale Price (Rs.)" required>
            <TextInput
              type="number"
              value={salePrice}
              onChange={(v) => { setSalePrice(v); setError(''); }}
              placeholder="0.00"
              min="0"
            />
          </FormRow>
          <FormRow label="Sale Date" required>
            <TextInput type="date" value={saleDate} onChange={setSaleDate} />
          </FormRow>
        </div>

        <FormRow label="Notes">
          <Textarea value={notes} onChange={setNotes} placeholder="Buyer name, reason for disposal…" rows={2} />
        </FormRow>

        {error && (
          <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50
            text-white text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100"
        >
          {loading ? 'Processing…' : 'Confirm Sale & Record Gain/Loss'}
        </button>
      </div>
    </ModalShell>
  );
};


// DEPRECIATION SCHEDULE MODAL
const DepreciationModal = ({ asset, onClose }) => {
  const schedule = useMemo(() => buildDepreciationSchedule(asset), [asset]);
  const today    = new Date().getFullYear();

  return (
    <ModalShell
      title="Depreciation Schedule"
      subtitle={`${asset?.name} — ${asset?.depreciationMethod === 'declining-balance' ? 'Declining Balance' : 'Straight-Line'}`}
      onClose={onClose}
      wide
    >
      <div className="space-y-5">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Original Cost',  value: `Rs. ${asset?.purchaseCost?.toLocaleString()}` },
            { label: 'Useful Life',    value: `${asset?.usefulLife || DEFAULT_USEFUL_LIVES[asset?.assetType]} yrs` },
            { label: 'Method',         value: asset?.depreciationMethod === 'declining-balance' ? 'Declining Balance' : 'Straight-Line' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className="text-sm font-black text-slate-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Year', 'Opening Value', 'Depreciation', 'Closing Value'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) => {
                const isCurrent = row.year === today;
                return (
                  <tr
                    key={row.year}
                    className={`border-b border-slate-100 last:border-0 transition-colors
                      ${isCurrent ? 'bg-indigo-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-3 font-black text-slate-900">
                      {row.year}
                      {isCurrent && (
                        <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">
                      Rs. {row.opening.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-rose-600 font-black">
                      − Rs. {row.depreciation.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-900">
                      Rs. {row.closing.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {schedule.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">
            No depreciation applies to this asset.
          </p>
        )}
      </div>
    </ModalShell>
  );
};

// MAIN PAGE
const AssetsPage = ({settings}) => {
  const dispatch = useDispatch();
  const assets  = useSelector(selectAssets);
  const loading = useSelector(selectFinanceLoading);
  const error   = useSelector(selectFinanceError);

  // UI State 
  const [searchTerm,    setSearchTerm]    = useState('');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('all');

  // Modal toggles
  const [modal, setModal] = useState(null); // 'purchase' | 'initial' | 'sale' | 'depreciation'
  const [selectedAsset, setSelectedAsset] = useState(null);

  const openModal  = (type, asset = null) => { setSelectedAsset(asset); setModal(type); };
  const closeModal = () => { setModal(null); setSelectedAsset(null); };

  //  Bootstrap 
  useEffect(() => { dispatch(fetchAssets()); }, [dispatch]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const active      = assets.filter((a) => a.status === 'Active');
    const totalCost   = assets.reduce((s, a) => s + (a.purchaseCost  || 0), 0);
    const totalBook   = active.reduce((s,  a) => s + (a.currentValue || a.purchaseCost || 0), 0);
    const maintenance = assets.filter((a) => a.status === 'Under Maintenance').length;
    const totalDeprec = assets
      .filter((a) => a.assetType !== 'Land' && a.status === 'Active')
      .reduce((s, a) => s + (getAnnualDepreciation(a) || 0), 0);
    return { totalCost, totalBook, maintenance, activeCount: active.length, totalDeprec };
  }, [assets]);

  // Filter Logic 
  const filteredAssets = useMemo(() =>
    assets.filter((a) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = a.name?.toLowerCase().includes(q) || a.assetType?.toLowerCase().includes(q);
      const matchType   = typeFilter   === 'all' || a.assetType === typeFilter;
      const matchStatus = statusFilter === 'all' || a.status    === statusFilter;
      return matchSearch && matchType && matchStatus;
    }),
    [assets, searchTerm, typeFilter, statusFilter]
  );

  // Thunk handlers
  const handlePurchase = (formData) => {
    dispatch(purchaseAsset(formData)).unwrap()
      .then(closeModal)
      .catch(() => {});
  };

  const handleSale = (saleData) => {
    if (!selectedAsset) return;
    dispatch(sellAsset({ id: selectedAsset._id, saleData })).unwrap()
      .then(closeModal)
      .catch(() => {});
  };

  // Table Columns 
  const columns = [
    {
      key: 'name',
      label: 'Asset Details',
      render: (row) => (
        <div className="py-1">
          <div className="font-black text-slate-900 text-sm leading-tight">{row.name}</div>
          <div className="text-[10px] text-indigo-600 font-mono uppercase tracking-wider mt-0.5">
            {row.assetType}
          </div>
          {row.notes && (
            <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{row.notes}</div>
          )}
        </div>
      ),
    },
    {
      key: 'purchaseDate',
      label: 'Acquired',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-600">
          {new Date(row.purchaseDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'cost',
      label: 'Original Cost',
      render: (row) => (
        <span className="text-xs text-slate-500 font-semibold">
          {settings?.currency} {row.purchaseCost?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'value',
      label: 'Book Value',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-black text-slate-900 text-sm">
            {settings?.currency} {row.currentValue?.toLocaleString()}
          </span>
          {row.assetType !== 'Land' && (
            <span className="text-[9px] text-rose-500 flex items-center gap-0.5 font-semibold">
              <TrendingDown size={9} />
              {settings?.currency} {getAnnualDepreciation(row)?.toLocaleString()} / yr
            </span>
          )}
          {row.assetType === 'Land' && (
            <span className="text-[9px] text-emerald-600 font-semibold">Non-depreciable</span>
          )}
        </div>
      ),
    },
    {
      key: 'usefulLife',
      label: 'Life / Method',
      render: (row) =>
        row.assetType === 'Land' ? (
          <span className="text-[10px] text-slate-300 italic">—</span>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black text-slate-700">
              {row.usefulLife || DEFAULT_USEFUL_LIVES[row.assetType]} yrs
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">
              {row.depreciationMethod === 'declining-balance' ? 'DB' : 'SL'}
            </span>
          </div>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variants = {
          Active:              'success',
          'Under Maintenance': 'warning',
          Sold:                'default',
          Disposed:            'danger',
        };
        return (
          <Badge variant={variants[row.status] || 'default'} className="font-black text-[10px] uppercase">
            {row.status}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          {/* Depreciation schedule — only depreciable */}
          {row.assetType !== 'Land' && (
            <button
              title="View Depreciation Schedule"
              onClick={() => openModal('depreciation', row)}
              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <BarChart2 size={15} />
            </button>
          )}
          {/* Sell */}
          {row.status === 'Active' && (
            <button
              title="Sell Asset"
              onClick={() => openModal('sale', row)}
              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <DollarSign size={15} />
            </button>
          )}
          {/* Maintenance */}
          {row.status === 'Active' && (
            <button
              title="Schedule Maintenance"
              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-400 hover:text-amber-600 transition-colors"
            >
              <Wrench size={15} />
            </button>
          )}
          {/* View History */}
          <button
            title="View History"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];


  // RENDER
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* BREADCRUMBS */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
        <Link to="/finance" className="hover:text-indigo-600 transition-colors">Finance</Link>
        <ChevronRight size={10} className="opacity-40" />
        <span className="text-slate-600">Fixed Assets</span>
      </div>

      {/* HEADER */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl
        flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Asset Register
          </h1>
          <p className="text-slate-500 text-sm font-semibold mt-1">
            Track equipment, land, buildings, furniture, machinery & depreciation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openModal('initial')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200
              text-slate-700 text-sm font-black uppercase tracking-wide hover:border-indigo-300
              hover:text-indigo-700 hover:bg-indigo-50 transition-all"
          >
            <Landmark size={16} />
            Add Initial Asset
          </button>
          
          <button
            onClick={() => openModal('purchase')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700
              text-white text-sm font-black uppercase tracking-wide shadow-lg shadow-indigo-200 transition-all"
          >
            <Plus size={16} />
            Purchase Asset
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-slate-200
              text-slate-600 text-sm font-black uppercase tracking-wide hover:border-slate-300
              hover:bg-slate-50 transition-all"
              onClick={() => dispatch(exportFinanceReport({ reportType: 'assets', format: 'pdf', filters: {} }))}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 text-rose-700 text-sm font-semibold">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label:   'Net Book Value',
            value:   `${settings?.currency} ${kpis.totalBook.toLocaleString()}`,
            accent:  'indigo',
            icon:    <Landmark size={18} />,
          },
          {
            label:   'Total Investment',
            value:   `${settings?.currency} ${kpis.totalCost.toLocaleString()}`,
            accent:  'slate',
            icon:    <PackagePlus size={18} />,
          },
          {
            label:   'Annual Depreciation',
            value:   `${settings?.currency} ${kpis.totalDeprec.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            accent:  'rose',
            icon:    <TrendingDown size={18} />,
          },
          {
            label:   'Under Maintenance',
            value:   kpis.maintenance,
            accent:  'amber',
            icon:    <Wrench size={18} />,
          },
          {
            label:   'Active Assets',
            value:   kpis.activeCount,
            accent:  'emerald',
            icon:    <CalendarClock size={18} />,
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`bg-white/70 backdrop-blur-xl border border-white p-5 rounded-[2rem] shadow-lg
              border-l-4 border-l-${k.accent}-400`}
          >
            <div className={`text-${k.accent}-500 mb-2`}>{k.icon}</div>
            <p className={`text-[10px] font-black text-${k.accent}-600 uppercase tracking-widest`}>
              {k.label}
            </p>
            <p className="text-xl font-black text-slate-900 mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-white/30">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search name or type…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm
                text-slate-700 placeholder:text-slate-300 bg-white/80 focus:outline-none
                focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <div className="flex gap-3">
            <NativeSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'all', label: 'All Types' },
                ...ASSET_TYPES,
              ]}
              className="rounded-2xl text-xs"
            />
            <NativeSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all',                label: 'All Statuses'     },
                { value: 'Active',             label: 'Active'           },
                { value: 'Under Maintenance',  label: 'In Maintenance'   },
                { value: 'Sold',               label: 'Sold'             },
                { value: 'Disposed',           label: 'Disposed'         },
              ]}
              className="rounded-2xl text-xs"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredAssets}
          loading={loading}
          emptyMessage="No assets found in the register."
        />
      </div>

      {/* MODALS */}
      {(modal === 'purchase' || modal === 'initial') && (
        <PurchaseModal
          isInitial={modal === 'initial'}
          onClose={closeModal}
          onSubmit={handlePurchase}
          loading={loading}
        />
      )}

      {modal === 'sale' && selectedAsset && (
        <SaleModal
          asset={selectedAsset}
          onClose={closeModal}
          onSubmit={handleSale}
          loading={loading}
        />
      )}

      {modal === 'depreciation' && selectedAsset && (
        <DepreciationModal
          asset={selectedAsset}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AssetsPage;