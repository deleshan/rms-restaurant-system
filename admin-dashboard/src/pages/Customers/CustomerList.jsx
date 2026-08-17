import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCustomers, 
  toggleCustomerStatus,
  triggerSegmentation 
} from '@/features/customer/customerThunks';
import { clearCustomerStatus } from '@/features/customer/customerSlice';
import { 
  selectAllCustomers, 
  selectCustomersLoading,
  selectFilteredCustomers 
} from '@/features/customer/customerSelector';
import DataTable from '@/components/common/DataTable';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Edit, Eye, Ban, RefreshCw, BrainCircuit, TrendingUp } from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from '@/components/common/Toast';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

const CustomerList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Selectors
  const loading = useSelector(selectCustomersLoading);
  const customers = useSelector(selectAllCustomers);
  // Pass searchTerm to your existing memoized selector
  const filteredCustomers = useSelector(selectFilteredCustomers(searchTerm));

  // INITIAL LOAD & CLEANUP
  useEffect(() => {
    dispatch(fetchCustomers({ page: 1, limit: 100 }));
    return () => dispatch(clearCustomerStatus());
  }, [dispatch]);

  // REAL-TIME UPDATES (Socket.io)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(apiUrl);

    socket.on('new_customer_registered', () => {
      toast.info("New customer registered!");
      dispatch(fetchCustomers({ page: 1, limit: 100 }));
    });

    return () => {
      socket.off('new_customer_registered');
      socket.disconnect();
    };
  }, [dispatch]);

  /* HANDLERS */
  const handleRunAiAnalysis = async () => {
    setIsAiProcessing(true);
    try {
      await dispatch(triggerSegmentation()).unwrap();
      toast.success("AI Segmentation Complete!");
      dispatch(fetchCustomers({ page: 1, limit: 100 }));
    } catch (err) {
      toast.error(err || "Failed to run AI analysis");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleToggleStatus = (id, currentStatus) => {
    const action = currentStatus ? 'block' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this customer?`)) {
      dispatch(toggleCustomerStatus({ id, isActive: !currentStatus }));
    }
  };


  const handleSearchChange = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
  );

  /* TABLE COLUMN DEFINITION */
  const columns = [
    {
      key: 'name',
      label: 'Customer Details',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-4 py-1">
          <div className="w-11 h-11 bg-indigo-100/80 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-700 font-black shadow-inner border border-white">
            {row.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-base">{row.name}</p>
            <p className="text-xs text-slate-500 font-mono font-bold tracking-tight">{row.phone || 'No Phone'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'segment',
      label: 'AI Segment',
      sortable: true,
      render: (row) => {
        const segment = row.segment || 'Unclassified';
        const colors = {
          'VIP': 'bg-amber-100 text-amber-700 border-amber-200',
          'Regular': 'bg-blue-100 text-blue-700 border-blue-200',
          'At-Risk': 'bg-rose-100 text-rose-700 border-rose-200',
          'Unclassified': 'bg-slate-100 text-slate-500 border-slate-200'
        };
        return (
          <div className={`px-3 py-1 rounded-lg border text-[11px] font-black uppercase tracking-wider w-fit ${colors[segment] || colors['Unclassified']}`}>
            <span className="flex items-center gap-1.5">
              {segment === 'VIP' && <TrendingUp size={12} />}
              {segment}
            </span>
          </div>
        );
      }
    },
    { 
      key: 'email', 
      label: 'Email', 
      render: (row) => <span className="text-sm text-slate-700 font-medium">{row.email || 'N/A'}</span>
    },
    {/*{
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.isActive !== false ? 'success' : 'danger'} className="font-bold">
          {row.isActive !== false ? 'Active' : 'Blocked'}
        </Badge>
      ),
    }*/},
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <div className="relative group/tooltip">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/customers/${row._id || row.id}`)}
              className="hover:bg-white/50 text-slate-600"
            >
              <Eye size={16} />
            </Button>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
                View Details
              </span>
          </div>
          
          {/*<Button variant="ghost" size="sm" className="hover:bg-white/50 text-slate-600"><Edit size={16} /></Button>*/}
          <div className="relative group/tooltip">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleToggleStatus(row._id || row.id, row.isActive)}
                className={row.isActive !== false ? "text-red-500 hover:bg-red-50/50" : "text-emerald-500 hover:bg-emerald-50/50"}
              >
                <Ban size={16} />
              </Button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
                    Block
              </span>
          </div>
          
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white shadow-xl shadow-slate-200/30">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Customer Database</h1>
          <p className="text-slate-600 font-semibold mt-2 flex items-center gap-2">
            Total Records: <span className="px-3 py-0.5 bg-indigo-100/50 text-indigo-700 rounded-full text-sm font-black">{customers.length}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={handleRunAiAnalysis}
            disabled={isAiProcessing || customers.length < 3}
            leftIcon={<BrainCircuit size={18} className={isAiProcessing ? "animate-pulse text-indigo-500" : ""} />}
            className="border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold"
          >
            {isAiProcessing ? "Analyzing..." : "Run AI Segmentation"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => dispatch(fetchCustomers({ page: 1, limit: 100 }))}
            leftIcon={<RefreshCw size={18} className={loading ? "animate-spin" : ""} />}
            className="border-white/60 bg-white/40 hover:bg-white/80"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-2xl shadow-slate-200/40 p-6">
        {loading && customers.length === 0 ? (
          <div className="py-24">
            <LoadingSpinner message="Accessing encrypted customer records..." />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredCustomers}
            searchPlaceholder="Search by name, phone, or email..."
            onSearchChange={handleSearchChange}
            emptyMessage={searchTerm ? `No results for "${searchTerm}"` : "No customers registered yet."}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerList;