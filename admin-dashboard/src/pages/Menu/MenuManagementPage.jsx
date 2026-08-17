import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Icons
import { 
  Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, 
  Download, RefreshCw, X, Eye, Package, Users, Grid, ChefHat,
  LayoutGrid, List, Calculator 
} from 'lucide-react';

import RecipeBuilderModal from './RecipeBuilderModal';
import PriceCalculatorModal from './PriceCalculatorModal';

// REDUX IMPORTS 
import { clearMenuSuccess } from '@/features/menu/menuSlice';
import { 
  fetchMenuItems, 
  deleteMenuItem, 
  toggleMenuItemAvailability 
} from '@/features/menu/menuThunks';
import { 
  selectAllMenuItems, 
  selectMenuLoading, 
  selectMenuError,
  selectMenuSuccessMessage 
} from '@/features/menu/menuSelector';

// Components
import DataTable from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

import MenuItemForm from './MenuItemForm';

const MenuManagementPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Selectors
  const menuItems = useSelector(selectAllMenuItems) || [];
  const loading = useSelector(selectMenuLoading);
  const error = useSelector(selectMenuError);
  const successMessage = useSelector(selectMenuSuccessMessage);
  const { settings } = useSelector(state => state.settings);

  // Filter & View State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [recipeItem, setRecipeItem] = useState(null);
  const [stationFilter, setStationFilter] = useState('all');
  const [priceCalcItem, setPriceCalcItem] = useState(null);

  // Lifecycle: Initial Fetch
  useEffect(() => {
    dispatch(fetchMenuItems({ availability: 'all' }));
  }, [dispatch]);

  // Handle Notifications & Auto-Refresh
  useEffect(() => {
    if (successMessage) {
      dispatch(fetchMenuItems({ availability: 'all' })); 
      
      const timer = setTimeout(() => {
        dispatch(clearMenuSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Action Handlers
  const handleAddClick = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleViewClick = (id) => {
    navigate(`/menu/${id}`); 
  };

  const handleToggleStatus = (id, currentStatus) => {
    dispatch(toggleMenuItemAvailability({ id, isAvailable: !currentStatus }));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      dispatch(deleteMenuItem(id));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Client-side Filtering 
  const filteredItems = menuItems.filter(item => {
    const matchesSearch =
      !searchTerm || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || item.category === categoryFilter;

    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && item.isAvailable) ||
      (availabilityFilter === 'unavailable' && !item.isAvailable) ||
      (availabilityFilter === 'outOfStock' && item.isOutOfStock);

    const matchesStation = stationFilter === 'all' || item.station === stationFilter;

    return matchesSearch && matchesCategory && matchesAvailability && matchesStation;
  });

  // Summary Stats
  const totalItems = menuItems.length;
  const activeItems = menuItems.filter(i => i.isAvailable).length;
  const outOfStockCount = menuItems.filter(i => i.isOutOfStock).length;

  // DataTable Columns
  const columns = [
    {
      key: 'name',
      label: 'Item Name',
      sortable: true,
      render: (row) => (
        <div 
          className={`flex-initial items-center gap-1cursor-pointer group transition-opacity ${!row.isAvailable ? 'opacity-60' : 'opacity-100'}`}
          onClick={() => handleViewClick(row._id || row.id)}
        >
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 font-bold border border-indigo-100 overflow-hidden shadow-sm transition-transform group-hover:scale-105">
            {row.image ? (
                <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            ) : (
                row.name?.charAt(0) || '?'
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {row.name} {!row.isAvailable && <span className="text-[10px] text-red-500 font-bold ml-2">(INACTIVE)</span>}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => <Badge variant="outline">{row.category}</Badge>
    },
    {
      key: 'station',
      label: 'Station',
      render: (row) => <Badge variant="outline">{row.station || '—'}</Badge>
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900">LKR {row.price?.toLocaleString()}</span>
      ),
    },
    {
        key: 'isAvailable',
        label: 'Status',
        render: (row) => (
          <div className="flex flex-col gap-1">
            <Badge variant={row.isAvailable ? 'success' : 'danger'}>
              {row.isAvailable ? 'Available' : 'Unavailable'}
            </Badge>
            {row.isOutOfStock && (
              <Badge variant="danger" className="text-[9px]">Out of Stock</Badge>
            )}
          </div>
        ),
      },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-x-1.5 flex-wrap">
          <div className="relative group/tooltip">
            <Button variant="ghost" size="sm" onClick={() => handleViewClick(row._id || row.id)}>
              <Eye size={16} className="text-indigo-500" />
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              View Item
            </span>
          </div>

          <div className="relative group/tooltip">
            <Button variant="ghost" size="sm" onClick={() => handleEditClick(row)}>
              <Edit size={16} className="text-gray-500" />
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              Edit Item
            </span>
          </div>

          <div className="relative group/tooltip">
            <Button variant="ghost" size="sm" onClick={() => setRecipeItem(row)}>
              <ChefHat size={16} className="text-indigo-500" />
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
               Ingredients
            </span>
          </div>
          <div className="relative group/tooltip">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full hover:bg-indigo-50 hover:text-indigo-600"
              onClick={() => setPriceCalcItem(row)}
            >
              <Calculator size={16} />
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              Price Calculator
            </span>
          </div>

          <div className="relative group/tooltip">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleToggleStatus(row._id || row.id, row.isAvailable)}
            >
              {row.isAvailable ? <ToggleLeft size={18} className="text-emerald-500" /> : <ToggleRight size={18} className="text-gray-400" />}
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              {row.isAvailable ? 'Deactivate' : 'Activate'}
            </span>
          </div>

          <div className="relative group/tooltip">
            <Button variant="ghost" size="sm" onClick={() => handleDelete(row._id || row.id)}>
              <Trash2 size={16} className="text-red-500" />
            </Button>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              Delete Item
            </span>
          </div>

        </div>
      ),
    },
  ];

  // 10. Card View Component
  const MenuItemCard = ({ item }) => (
    <Card variant="default" className="overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-white/70 backdrop-blur-md rounded-[2rem] flex flex-col h-full">
      <div className="relative h-48 w-full overflow-hidden rounded-[1rem]">
        {item.image ? (
            <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-200 font-black text-5xl">
            {item.name?.charAt(0)}
          </div>
        )}
        <div className="absolute top-4 inset-x-4 flex flex-wrap gap-2 justify-between items-start">
          <Badge 
            variant="outline" 
            className="bg-white/80 backdrop-blur-sm border-none text-[10px] uppercase font-bold shadow-sm whitespace-nowrap"
          >
            {item.category}
          </Badge>
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm border-none text-[10px] uppercase font-bold shadow-sm whitespace-nowrap">
            {item.station || '—'}
          </Badge>
          {item.isOutOfStock && (
            <Badge variant="danger" className="shadow-lg backdrop-blur-md whitespace-nowrap">
              Out of Stock
            </Badge>
          )}
          <Badge 
            variant={item.isAvailable ? 'success' : 'danger'} 
            className="shadow-lg backdrop-blur-md whitespace-nowrap"
          >
            {item.isAvailable ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-shrink">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors truncate">
            {item.name}
          </h3>
          <span className="text-indigo-600 font-black whitespace-nowrap">{settings.currency} {item.price?.toLocaleString()}</span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-6 h-8 font-medium italic">
          {item.description || "No description provided."}
        </p>
        
        
      </div>
      <div className="flex mt-auto items-center justify-between pt-2 border-t border-gray-100/50 w-full">
          <div className="flex-auto">
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-indigo-50 hover:text-indigo-600" onClick={() => handleViewClick(item._id || item.id)}>
              <Eye size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-gray-100" onClick={() => handleEditClick(item)}>
              <Edit size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-red-50 hover:text-red-500" onClick={() => handleDelete(item._id || item.id)}>
              <Trash2 size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-red-50 hover:text-red-500" onClick={() => setRecipeItem(item)}>
              <ChefHat size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full hover:bg-indigo-50 hover:text-indigo-600"
              onClick={() => setPriceCalcItem(item)}
            >
              <Calculator size={16} />
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="rounded-full"
            onClick={() => handleToggleStatus(item._id || item.id, item.isAvailable)}
          >
             {item.isAvailable ? <ToggleLeft size={22} className="text-emerald-500" /> : <ToggleRight size={22} className="text-gray-300" />}
          </Button>
        </div>
    </Card>
  );

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Menu Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Configure your digital menu and item availability.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative group/tooltip">
            <Button variant="default" className="text-brand hover:text-white border-brand" leftIcon={<Download size={18} />}>Export</Button>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              Download CSV
            </span>
          </div>

          <div className="relative group/tooltip">
            <Button variant="default" className="text-brand hover:text-white border-brand" leftIcon={<Plus size={18} />} onClick={handleAddClick}>
              Add Item
            </Button>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              Create New
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Total Items" variant="default" icon={<RefreshCw size={16} />}>
          <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
        </Card>
        <Card title="Available" variant="success" icon={<ToggleRight size={16} />}>
          <p className="text-3xl font-bold text-emerald-600">{activeItems}</p>
        </Card>
        <Card title="Out of Stock" variant="danger" icon={<Package size={16} />}>
          <p className="text-3xl font-bold text-rose-600">{outOfStockCount}</p>
        </Card>
        <Card title="Categories" variant="default" icon={<Users size={16} />}>
          <p className="text-3xl font-bold text-indigo-600">
            {new Set(menuItems.map(i => i.category)).size}
          </p>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="relative z-20 bg-white/40 backdrop-blur-xl border border-white/60 p-5 rounded-[2rem] shadow-xl shadow-gray-200/20">
        <div className="flex flex-col gap-5">
          <div className="w-full">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search} 
              iconPosition="left"
              fullWidth={true}
              className="bg-white/50 border-white/60 rounded-2xl w-full shadow-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 overflow-visible relative z-50">
            <div className="flex flex-1 w-full sm:w-auto gap-3">
              <Select
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="bg-white/50 border-white/60 rounded-xl flex-1"
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'Main Course', label: 'Main Course' },
                  { value: 'Beverages', label: 'Beverages' },
                  { value: 'Desserts', label: 'Desserts' },
                ]}
              />
              <Select
                value={availabilityFilter}
                onChange={setAvailabilityFilter}
                className="bg-white/50 border-white/60 rounded-xl flex-1"
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'available', label: 'Available' },
                  { value: 'unavailable', label: 'Unavailable' },
                  { value: 'outOfStock', label: 'Out of Stock' },
                ]}
              />
              <Select
                  value={stationFilter}
                  onChange={setStationFilter}
                  className="bg-white/50 border-white/60 rounded-xl flex-1"
                  options={[
                    { value: 'all', label: 'All Stations' },
                    { value: 'Hot Station', label: 'Hot Station' },
                    { value: 'Cold Station', label: 'Cold Station' },
                    { value: 'Bar / Drinks', label: 'Bar / Drinks' },
                  ]}
                />
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* View Switcher */}
              <div className="flex bg-indigo-50/50 p-1 rounded-xl border border-indigo-100/50 shadow-inner">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-indigo-400'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-indigo-400'}`}
                  onClick={() => setViewMode('table')}
                >
                  <List size={18} />
                </Button>
              </div>

              <div className="relative group/tooltip">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="bg-white/50 border-white/60 rounded-xl shadow-sm hover:bg-white/80"
                  onClick={() => dispatch(fetchMenuItems({ availability: 'all' }))}
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-600'} />
                </Button>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
                  Refresh Sync
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && menuItems.length === 0 ? (
        <div className="py-24"><LoadingSpinner message="Fetching items..." /></div>
      ) : error ? (
        <div className="p-12"><ErrorMessage message={error} /></div>
      ) : (
        <div className="transition-all duration-500 ">
          {viewMode === 'table' ? (
            <Card variant="elevated" className="p-3 border-none animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-auto">
              <DataTable
                columns={columns}
                data={filteredItems}
                emptyMessage="No menu items found."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in zoom-in-95 duration-500">
              {filteredItems.map(item => (
                <MenuItemCard key={item._id || item.id} item={item} />
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4">
                    <Grid size={40} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold text-lg tracking-tight">No menu items match your current filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
      <PriceCalculatorModal
        isOpen={!!priceCalcItem}
        onClose={() => setPriceCalcItem(null)}
        menuItemId={priceCalcItem?._id}
        menuItemName={priceCalcItem?.name}
        currentPrice={priceCalcItem?.price}
        onPriceApplied={(newPrice) => {
          // Reflects immediately without waiting for a full refetch
          dispatch(fetchMenuItems({ availability: 'all' }));
        }}
      />
    </div>
    
  );
};

export default MenuManagementPage;