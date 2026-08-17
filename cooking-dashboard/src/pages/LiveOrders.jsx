import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ChefHat, 
  LayoutGrid, 
  List,
  Utensils,
  RefreshCw
} from 'lucide-react';

// Socket
import { socket } from '@/socket'; 

// Selectors & Thunks
import { 
  fetchActiveOrders, 
  updateOrderStatusThunk 
} from '@/features/orders/orderThunks';

import { 
  selectOrdersLoading, 
  selectPrioritizedOrders,
  selectSocketConnected
} from '@/features/orders/orderSelectors';

import { 
  addNewOrder, 
  updateOrderStatusSuccess,
  setConnectionStatus 
} from '@/features/orders/orderSlice'; 

import { 
  selectAssignedStation, 
  selectRestaurantId,
  selectStaffDisplayName 
} from '@/features/auth/authSelectors';

import { toast } from '@/components/common/Toast';

// Components
import OrderCard from './OrderCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const LiveOrders = () => {
  const dispatch = useDispatch();
  
  // Redux State
  const orders = useSelector(selectPrioritizedOrders);
  const loading = useSelector(selectOrdersLoading);
  const isConnected = useSelector(selectSocketConnected);
  const currentStation = useSelector(selectAssignedStation);
  const restaurantId = useSelector(selectRestaurantId);
  const displayName = useSelector(selectStaffDisplayName);

  // Local UI State
  const [viewMode, setViewMode] = useState('grid'); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [hasInitialized, setHasInitialized] = useState(false);

  
  // Real-time Sync & Event Listeners
  
  useEffect(() => {
    if (!restaurantId) return;

    // Initial Fetch
    dispatch(fetchActiveOrders());

    // Join the room explicitly to ensure sync
    // Matches Backend: `kitchen_${restaurantId}`
    socket.emit('join-kitchen-room', restaurantId);

    //  Socket Handlers 
    const handleNewOrder = (order) => {
      // Logic check: ensure order belongs to this restaurant
      if (order.restaurantId === restaurantId) {
        dispatch(addNewOrder(order));

        // Play Notification
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});

        toast.info(`New Order - Table ${order.tableId}`, {
          description: `Order #${order._id.slice(-5).toUpperCase()}`
        });
      }
    };

    const handleStatusUpdate = (data) => {
      // Updates the list if an order is cancelled or paid via Admin
      dispatch(updateOrderStatusSuccess(data));
    };

    //  Register Listeners 
    socket.on('new-order', handleNewOrder);
    socket.on('NEW_ORDER_RECEIVED', handleNewOrder);
    socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);

    setHasInitialized(true);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('NEW_ORDER_RECEIVED', handleNewOrder);
      socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
    };
  }, [restaurantId, dispatch]);

  // Reconnection Logic
  
  useEffect(() => {
    if (isConnected && restaurantId && hasInitialized) {
      // Re-join room and re-fetch to ensure no orders were missed while offline
      socket.emit('join-kitchen-room', restaurantId);
      dispatch(fetchActiveOrders());
    }
  }, [isConnected, restaurantId, hasInitialized, dispatch]);


  //  UI Logic & Handlers

  const displayOrders = orders.filter(order => 
    statusFilter === 'All' ? true : order.status === statusFilter
  );

  const handleUpdateStatus = useCallback((orderId, newStatus) => {
    dispatch(updateOrderStatusThunk({ orderId, status: newStatus }));
  }, [dispatch]);


  // Render States
 
  if (!restaurantId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-slate-400">
        <ChefHat className="mx-auto mb-6 h-16 w-16 text-orange-500/50" />
        <h2 className="mb-3 text-2xl font-bold text-white">Kitchen ID Required</h2>
        <p className="mb-8 text-slate-500">Please log in to access the Kitchen Display System.</p>
        <button onClick={() => window.location.reload()} className="bg-slate-800 p-3 rounded-xl text-white flex items-center gap-2">
          <RefreshCw size={18} /> Retry
        </button>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return <LoadingSpinner message="Syncing Live Orders..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      {/* Kitchen Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-slate-900/50 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-3 rounded-2xl">
            <ChefHat className="text-white w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">
                Live<span className="text-orange-500">Orders</span>
              </h1>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? 'KITCHEN ONLINE' : 'OFFLINE'}
              </div>
            </div>
            <p className="text-slate-400 text-sm">{displayName} • {currentStation || 'General Station'}</p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <nav className="flex bg-slate-800/80 p-1 rounded-xl">
            {['All', 'Pending', 'Preparing', 'Ready'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-tighter transition-all ${
                  statusFilter === s ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </nav>
          <div className="flex bg-slate-800/80 p-1 rounded-xl">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'text-orange-500' : 'text-slate-500'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'text-orange-500' : 'text-slate-500'}`}>
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      {displayOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
          <Utensils size={60} className="mb-4 opacity-20" />
          <p className="text-lg">No orders in queue</p>
        </div>
      ) : (
        <main className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" : "flex flex-col gap-4 max-w-5xl mx-auto"}>
          {displayOrders.map((order) => (
            <OrderCard 
              key={order._id} 
              order={order} 
              onUpdateStatus={handleUpdateStatus} 
              viewMode={viewMode} 
            />
          ))}
        </main>
      )}
    </div>
  );
};

export default LiveOrders;