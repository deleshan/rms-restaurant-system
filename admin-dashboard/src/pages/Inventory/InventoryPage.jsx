import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, Database, History, RefreshCw, Search, Pencil, AlertTriangle, Clock, Package, Layers, Upload, X, CheckCircle2 
} from 'lucide-react';
import StockMovementDrawer from './StockMovementDrawer';
import { clearInventoryStatus } from '@/features/inventory/inventorySlice';
import { fetchInventoryItems } from '@/features/inventory/inventoryThunks';
import { 
  selectInventoryLoading,
  selectInventoryUploading,
  selectInventoryError,
  selectInventorySuccessMessage,
  selectLowStockCount,
  selectOutOfStockCount,
  selectExpiringSoonCount,
  selectTotalInventoryValue,
  selectFilteredInventory 
} from '@/features/inventory/inventorySelector';
import FoodDatabaseModal from '@/components/common/FoodDatabaseModal';
import InventoryEditModal from './InventoryEditModal';

// UI Components
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { cn } from '@/utils/cn';
import BulkUploadModal from './BulkUploadModal';



const InventoryStat = ({ label, value, icon: Icon, color }) => (
  <Card className="relative overflow-hidden border-none shadow-xl shadow-slate-200/50 bg-white/80 group p-6">
    <div className={cn("absolute top-0 left-0 w-1.5 h-full", color)} />
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
        <p className="text-3xl font-black tracking-tighter text-slate-900">{value}</p>
      </div>
      <div className={cn("p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:scale-110 transition-transform duration-500")}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

const InventoryPage = () => {
  const dispatch = useDispatch();

  // Local UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('import');
  const [drawerItem, setDrawerItem] = useState(null);
  const [isFoodDbOpen, setIsFoodDbOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  // Selectors
  const loading = useSelector(selectInventoryLoading);
  const uploading = useSelector(selectInventoryUploading);
  const error = useSelector(selectInventoryError);
  const successData = useSelector(selectInventorySuccessMessage);
  
  const lowStockCount = useSelector(selectLowStockCount);
  const outOfStockCount = useSelector(selectOutOfStockCount);
  const expiringSoonCount = useSelector(selectExpiringSoonCount);
  const totalValue = useSelector(selectTotalInventoryValue);
  const filteredItems = useSelector((state) => selectFilteredInventory(state, searchTerm, categoryFilter));

  useEffect(() => {
    dispatch(fetchInventoryItems({ page: 1, limit: 100 }));
  }, [dispatch]);

  const columns = [
    { 
      key: 'name', 
      label: 'Item Asset', 
      render: (row) => (
        <div className="py-2">
          <div className="font-bold text-slate-900">{row.name}</div>
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">SKU: {row.sku || 'N/A'}</div>
        </div>
      )
    },
    { 
      key: 'category', 
      label: 'Category',
      render: (row) => (
        <Badge variant="outline" className="capitalize bg-white/50 border-slate-200 text-slate-600 font-bold">
          {row.category}
        </Badge>
      )
    },
    { 
      key: 'currentStock', 
      label: 'Quantity',
      render: (row) => (
        <div className="flex flex-col">
          <span className={cn(
            "text-lg font-black",
            row.currentStock <= row.minimumStock ? "text-rose-600" : "text-slate-700"
          )}>
            {row.currentStock}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{row.unit || 'pcs'}</span>
        </div>
      )
    },
    { 
      key: 'costPerUnit', 
      label: 'Unit Price',
      render: (row) => (
        <div className="font-bold text-slate-700">
          LKR {(row.costPerUnit || 0).toLocaleString()}
          <span className="text-[10px] text-slate-400 font-medium"> / {row.unit || 'pcs'}</span>
        </div>
      )
    },
    { 
      key: 'expiryDate', 
      label: 'Expiry',
      render: (row) => {
        if (!row.expiryDate) return <span className="text-slate-300 text-xs font-medium">—</span>;
        const expiry = new Date(row.expiryDate);
        const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft < 0;
        const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7;

        return (
          <span className={cn(
            "text-xs font-bold",
            isExpired ? "text-rose-600" : isExpiringSoon ? "text-amber-600" : "text-slate-500"
          )}>
            {expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Stock Status',
      render: (row) => {
        if (row.currentStock <= 0) return <Badge variant="danger" className="rounded-full">Critical Out</Badge>;
        if (row.currentStock <= row.minimumStock) return <Badge variant="warning" className="rounded-full text-amber-700 font-bold italic">Refill Soon</Badge>;
        return <Badge variant="success" className="rounded-full">Healthy</Badge>;
      }
    }, 
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditItem(row)}
            className="p-2 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Edit Price / Expiry / Unit"
          >
            <Pencil size={16} className="text-indigo-400" />
          </button>
          <button
            onClick={() => setDrawerItem(row)}
            className="p-2 hover:bg-indigo-50 rounded-xl transition-colors"
            title="Stock History"
          >
            <History size={16} className="text-indigo-400" />
          </button>
        </div>
      )
    }
    
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 space-y-8 animate-in fade-in duration-700">
      
      {/* INLINE NOTIFICATION BANNER  */}
      {(error || successData) && (
        <div className={cn(
          "p-5 rounded-[2rem] border shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500",
          error ? "bg-rose-50 border-rose-100 text-rose-900" : "bg-emerald-50 border-emerald-100 text-emerald-900"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn("p-2 rounded-xl", error ? "bg-rose-500 text-white" : "bg-emerald-500 text-white")}>
              {error ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <p className="font-black text-xs uppercase tracking-widest leading-none mb-1">System Notification</p>
              <p className="font-bold text-sm">
                {error || (typeof successData === 'object' ? successData.message : successData)}
              </p>
            </div>
          </div>
          <button 
            onClick={() => dispatch(clearInventoryStatus())}
            className="h-10 w-10 flex items-center justify-center hover:bg-black/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/*  HEADER  */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Inventory</h1>
          <p className="text-slate-500 font-medium italic">Asset management & real-time stock valuation.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="white" 
            onClick={() => dispatch(fetchInventoryItems({ page: 1, limit: 100 }))}
            className="shadow-xl border-white/60 rounded-2xl h-12 w-12 flex items-center justify-center p-0"
          >
            <RefreshCw size={18} className={cn("text-slate-500", loading && "animate-spin")} />
          </Button>
          
          <Button 
            variant="white" 
            onClick={() => {
              setModalMode('import');
              setIsUploadModalOpen(true);
            }}
            icon={Upload}
            className="h-12 px-6 rounded-2xl shadow-lg border-white font-bold text-indigo-600 bg-white/80 hover:bg-white"
          >
            Bulk Import
          </Button>

          <Button 
            variant="white" 
            onClick={() => {
              setModalMode('purchase');
              setIsUploadModalOpen(true);
            }}
            icon={Package}
            className="h-12 px-6 rounded-2xl shadow-lg border-white font-bold text-emerald-600 bg-white/80 hover:bg-white"
          >
            Log Purchase
          </Button>

          
          <Button
            variant="white"
            onClick={() => setIsFoodDbOpen(true)}
            icon={Database}
            className="h-12 px-6 rounded-2xl shadow-lg border-white font-bold text-emerald-600 bg-white/80 hover:bg-white"
          >
            Food Database
          </Button>
          {/*<Button 
          variant="white" 
          icon={Plus} 
          onClick={() => setIsAddItemOpen(true)}
            className="h-12 px-6 rounded-2xl shadow-lg border-white font-bold text-emerald-600 bg-white/80 hover:bg-white">
            Add Item
          </Button>*/}
        </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Guard check added to safely handle null/undefined totalValue */}
        <InventoryStat 
          label="Valuation" 
          value={`LKR ${(totalValue || 0).toLocaleString()}`} 
          icon={Package} 
          color="bg-indigo-500" 
        />
        <InventoryStat label="Low Threshold" value={lowStockCount} icon={Clock} color="bg-amber-500" />
        <InventoryStat label="Depleted" value={outOfStockCount} icon={AlertTriangle} color="bg-rose-500" />
        <InventoryStat label="Expiring" value={expiringSoonCount} icon={Layers} color="bg-purple-500" />
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/40">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1">
            <Input
              placeholder="Filter by name, SKU or serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              iconPosition="left"
              fullWidth
              className="bg-white/60 border-white shadow-inner rounded-2xl h-12"
            />
          </div>

          <div className="flex flex-row items-center gap-4 min-w-[320px]">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="bg-white/60 border-white rounded-xl flex-1 shadow-sm h-12"
              options={[
                { value: 'all', label: 'Global Warehouse' },
                { value: 'Produce', label: 'Fresh Produce' },
                { value: 'Meat', label: 'Meat & Poultry' },
                { value: 'Dry Goods', label: 'Dry Pantry' },
                { value: 'Assets', label: 'Fixed Assets' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/80 overflow-hidden shadow-2xl shadow-slate-200/30 p-8">
        {loading && filteredItems.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-4 text-center">
            <LoadingSpinner size="lg" />
            <div className="space-y-1">
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Data</p>
              <p className="text-xs text-slate-500 font-medium">Updating real-time inventory buffers...</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredItems}
            className="text-slate-700"
            emptyMessage="No assets found matching your criteria."
          />
        )}
      </div>

      {/* MODALS & DRAWERS */}
      <BulkUploadModal 
        isOpen={isUploadModalOpen} 
        mode={modalMode}
        isUploading={uploading}
        onClose={() => {
            setIsUploadModalOpen(false);
            dispatch(clearInventoryStatus());
            dispatch(fetchInventoryItems({ page: 1, limit: 100 }));
        }} 
      />
      <StockMovementDrawer
        isOpen={!!drawerItem}
        onClose={() => setDrawerItem(null)}
        item={drawerItem}
      />
      <FoodDatabaseModal
        isOpen={isFoodDbOpen}
        onClose={() => setIsFoodDbOpen(false)}
      />
      <InventoryEditModal
        isOpen={!!editItem}
        item={editItem}
        onClose={() => {
          setEditItem(null);
          dispatch(fetchInventoryItems({ page: 1, limit: 100 })); 
        }}
      />
      
    </div>
  );
};

export default InventoryPage;