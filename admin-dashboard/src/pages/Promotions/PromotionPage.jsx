import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PromotionFormModal from './PromotionFormModal';

// Icons
import { 
  Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, 
  Download, Calendar, RefreshCw, Send 
} from 'lucide-react';

// Redux Actions
import {
  fetchPromotions,
  deletePromotion,
  togglePromotionStatus,
  clearPromotionSuccess,
  launchPromotionCampaign
} from '@/features/promotions/promotionSlice';

// Redux Selectors
import {
  selectAllPromotions,
  selectPromotionsLoading,
  selectPromotionsError,
  selectPromotionsSuccessMessage,
  selectFilteredPromotions,
} from '@/features/promotions/promotionSelector';

// Components
import DataTable from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/common/Card';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

const PromotionPage = () => {
  const dispatch = useDispatch();

  // Local State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  // Redux State
  const promotions = useSelector(selectAllPromotions) || [];
  const loading = useSelector(selectPromotionsLoading);
  const error = useSelector(selectPromotionsError);
  const successMessage = useSelector(selectPromotionsSuccessMessage);
  
  const filteredPromotions = useSelector((state) => 
  selectFilteredPromotions(state, searchTerm, statusFilter)
);
  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchPromotions());
  }, [dispatch]);

  // Handle Success Notifications
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearPromotionSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleOpenCreateModal = () => {
  setEditingPromotion(null);
  setIsModalOpen(true);
  };

  const handleOpenEditModal = (promotion) => {
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPromotion(null);
  };

  const handleToggleStatus = (id, currentStatus) => {
    dispatch(togglePromotionStatus({ id, isActive: !currentStatus }));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this promotion? This action is permanent.')) {
      dispatch(deletePromotion(id));
    }
  };

  const handleLaunch = (id) => {
  if (window.confirm('Launch this campaign now? This will send SMS/email to the target segment.')) {
    dispatch(launchPromotionCampaign(id));
  }
};

  // KPI Calculations (Memoized for performance)
  const stats = useMemo(() => {
    const active = promotions.filter(p => p.isActive && (!p.endDate || new Date(p.endDate) > new Date())).length;
    const totalDiscount = promotions.reduce((sum, p) => sum + (p.totalDiscountApplied || 0), 0);
    const expiring = promotions.filter(p => {
      if (!p.endDate) return false;
      const diffTime = new Date(p.endDate) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    }).length;

    return { active, totalDiscount, expiring, total: promotions.length };
  }, [promotions]);

  // Table Column Definitions
  const columns = [
    {
      key: 'title',
      label: 'Promotion',
      sortable: true,
      render: (row) => (
        <div className="py-1">
          <div className="font-semibold text-gray-900">{row.title}</div>
          <div className="text-xs text-indigo-600 font-mono font-medium">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'discount',
      label: 'Value',
      render: (row) => (
        <Badge variant={row.discountType === 'percentage' ? 'success' : 'info'}>
          {row.discountType === 'percentage' ? `${row.discountValue}% OFF` : `Rs. ${row.discountValue}`}
        </Badge>
      ),
    },
    {
      key: 'usage',
      label: 'Redemptions',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">{row.usageCount || 0} Uses</span>
          <span className="text-[10px] text-gray-400">Limit: {row.usageLimit || '∞'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isExpired = row.endDate && new Date(row.endDate) < new Date();
        if (isExpired) return <Badge variant="destructive">Expired</Badge>;
        if (!row.isActive) return <Badge variant="warning">Paused</Badge>;
        return <Badge variant="success">Active</Badge>;
      },
    },
    {
      key: 'validity',
      label: 'Valid Until',
      render: (row) => (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={14} className="text-gray-400" />
          {row.endDate ? new Date(row.endDate).toLocaleDateString() : 'No Expiry'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Edit" onClick={() => handleOpenEditModal(row)}>
          <Edit size={16} className="text-gray-500" />
        </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleStatus(row._id || row.id, row.isActive)}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? (
              <ToggleLeft size={20} className="text-emerald-500" />
            ) : (
              <ToggleRight size={20} className="text-gray-300" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDelete(row._id || row.id)}
            title="Delete"
          >
            <Trash2 size={16} className="text-red-400 hover:text-red-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleLaunch(row._id || row.id)}
            title="Launch Campaign"
            disabled={!row.isActive}
          >
            <Send size={16} className="text-blue-400 hover:text-blue-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing & Promotions</h1>
          <p className="text-gray-500 text-sm">Create and monitor discount campaigns.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Download size={18} />}>Export</Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={handleOpenCreateModal}>
            New Promotion
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-t-4 border-t-emerald-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Active Offers</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-blue-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Discount Given</p>
          <p className="text-2xl font-bold text-blue-600">LKR {stats.totalDiscount.toLocaleString()}</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-amber-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Expiring Soon</p>
          <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-indigo-500">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Campaigns</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 shadow-sm border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search title or code (e.g. SUMMER20)..."
              value={searchTerm}
              icon={Search} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select
              className="min-w-[150px]"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' },
              ]}
            />
            <Button variant="outline" onClick={() => dispatch(fetchPromotions())} title="Refresh Data">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Section */}
      <Card className="overflow-hidden shadow-sm border-gray-200">
        {loading && promotions.length === 0 ? (
          <div className="py-20"><LoadingSpinner message="Fetching campaigns..." /></div>
        ) : error ? (
          <div className="p-10 text-center"><ErrorMessage message={error} /></div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredPromotions}
            emptyMessage="No promotions found. Create your first campaign to boost sales!"
          />
        )}
      </Card>
      <PromotionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingPromotion={editingPromotion}
      />
    </div>
  );
};

export default PromotionPage;