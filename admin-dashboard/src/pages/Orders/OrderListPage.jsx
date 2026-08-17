import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { socket } from '@/socket';
import api from '@/services/api';

// Redux Actions & Selectors
import { fetchOrders, updateOrderStatus } from '@/features/orders/orderThunks';
import { selectAllOrders, selectOrdersLoading } from '@/features/orders/orderSelector';
import { selectUser } from '@/features/auth/authSelectors';
import { socketOrderUpdated, socketNewOrder } from '@/features/orders/orderSlice';

import { toast } from '@/components/common/Toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import { 
  Search, RefreshCw, Clock, ChevronRight, CreditCard, 
  ChefHat, AlertCircle, Printer, CheckCircle2, 
  LayoutGrid, List, BadgeCheck, Activity, Mail, Smartphone
} from 'lucide-react';

// Sub-Component: Modern Glass Order Card 
const OrderCard = ({ order, type, onStatusUpdate, onMarkAsPaid }) => {
  const [actionStatus, setActionStatus] = useState('idle');

  const getPreferenceIcon = (pref) => {
    const p = pref?.toLowerCase() || '';
    if (p.includes('email')) return <Mail size={12} />;
    if (p.includes('sms') || p.includes('whatsapp')) return <Smartphone size={12} />;
    return <Printer size={12} />;
  };

  const handleBillAction = async (orderId, preference) => {
    setActionStatus('sending');
    try {
      const response = await api.post(`/orders/${orderId}/send-bill`);
      const data = response.data;

      // Handle 'Printed Bill' - open PDF in new tab so browser print dialog appears
      if (data.channel === 'print' && data.pdfBase64) {
        const byteChars   = atob(data.pdfBase64);
        const byteNumbers = Array.from(byteChars, c => c.charCodeAt(0));
        const blob        = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
        const blobUrl     = URL.createObjectURL(blob);

        const printWindow = window.open(blobUrl, '_blank');
        // Trigger print dialog after PDF loads
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print();
          });
        }
      }

      setActionStatus('sent');
      toast.success(data.message || `${preference || 'Bill'} sent successfully!`);

    } catch (err) {
      setActionStatus('error');
      const message = err.response?.data?.message || 'Failed to send bill';
      toast.error(message);
      setTimeout(() => setActionStatus('idle'), 3000);
    }
  };

  const getActiveTime = () => {
    const minutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
    return minutes < 1 ? 'Just now' : `${minutes}m ago`;
  };

  return (
    <div className={`group relative rounded-[2rem] p-5 transition-all duration-300 border backdrop-blur-2xl shadow-xl hover:shadow-2xl active:scale-[0.98] max-h-fit flex flex-col justify-between overflow-hidden
      ${type === 'pending' ? 'bg-white/40 border-amber-200/50 shadow-amber-500/5' : 
        type === 'preparing' ? 'bg-white/40 border-blue-200/50 shadow-blue-500/5' : 
        order.billRequested && !order.isPaid ? 'bg-rose-50/40 border-rose-300/50 ring-1 ring-rose-400/20' : 'bg-white/40 border-emerald-200/50 shadow-emerald-500/5'
      }`}>
      
      {/* Background Glow Effect */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 rounded-full
        ${type === 'pending' ? 'bg-amber-400' : type === 'preparing' ? 'bg-blue-400' : 'bg-emerald-400'}`} />

      {/* Header Section */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full inline-block mb-3 border shadow-sm
            ${type === 'pending' ? 'bg-amber-100/80 border-amber-200 text-amber-700' : 
              type === 'preparing' ? 'bg-blue-100/80 border-blue-200 text-blue-700' : 
              'bg-emerald-100/80 border-emerald-200 text-emerald-700'}`}>
            {order.billRequested && !order.isPaid ? 'Payment Requested' : order.status}
          </div>

            {/* Customer Billing Preference Badge */}
            {order.billRequested && order.billingPreference && (
              <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full shadow-lg animate-pulse mb-4">
                {getPreferenceIcon(order.billingPreference)}
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                  {order.billingPreference}
                </span>
              </div>
            )}

          <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Table {order.tableId || '??'}</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter opacity-70">
            ID: {order._id?.slice(-6).toUpperCase()} • {order.user?.name || 'Guest'}
          </p>
        </div>
        <div className="flex items-center backdrop-blur-md bg-white/40 px-2.5 py-1 rounded-full border border-white/50 text-slate-500 gap-1.5 shadow-sm">
          <Clock size={12} className="text-indigo-500" />
          <span className="text-[10px] font-black tracking-tighter uppercase">{getActiveTime()}</span>
        </div>
      </div>

      {/* Items List */}
      <div className="relative z-10 space-y-2 mb-4 bg-white/30 rounded-2xl p-3 border border-white/40 shadow-inner">
        {order.items?.map((item, idx) => (
          <div key={idx} className="flex justify-between text-[13px]">
            <span className="text-slate-700 font-bold tracking-tight">
              <span className="text-indigo-600 font-black mr-1">{item.quantity || item.qty}x</span> {item.name}
            </span>
            <span className="font-black text-slate-500 tabular-nums">Rs. {((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Total Amount */}
      <div className="relative z-10 flex justify-between items-center mb-5 px-1">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total Bill</span>
        <span className="text-xl font-black text-slate-900 tracking-tighter">
          <span className="text-xs mr-1 opacity-50 font-medium">LKR</span>
          {(order.totalPrice || 0).toLocaleString()}
        </span>
      </div>
      
      {/* Action Buttons */}
      <div className="relative z-10 w-full space-y-3">
        {type === 'pending' && (
          <button onClick={() => onStatusUpdate(order._id, 'Preparing')}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs tracking-widest border border-emerald-400/30">
            <ChefHat size={18} /> Start Cooking
          </button>
        )}
        
        {order.status === 'Preparing' && (
          <button onClick={() => onStatusUpdate(order._id, 'Ready')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs tracking-widest border border-blue-400/30">
            <CheckCircle2 size={18} /> Mark Ready
          </button>
        )}

        {order.status === 'Ready' && (
          <button onClick={() => onStatusUpdate(order._id, 'Ready')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs tracking-widest border border-blue-400/30">
            <CheckCircle2 size={18} /> completed
          </button>
        )}

        {type === 'payment' && (
          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled={actionStatus === 'sent' || actionStatus === 'sending'}
              onClick={() => handleBillAction(order._id, order.billingPreference)}
              className={`font-black py-4 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 text-[10px] uppercase tracking-widest border
                ${actionStatus === 'idle' ? 'bg-white/60 border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
              <Printer size={14} /> {actionStatus === 'sent' ? 'Sent' : 'Bill'}
            </button>
            <button onClick={() => onMarkAsPaid(order._id)}
              className="bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest active:scale-95 transition-all">
              <CreditCard size={14} /> Paid
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Page Component
const OrderListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('kanban');

  const user = useSelector(selectUser);
  const restaurantId = user?.restaurantId;
  const orders = useSelector(selectAllOrders);
  const isLoading = useSelector(selectOrdersLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    if (restaurantId) dispatch(fetchOrders({ status: statusFilter, restaurantId }));
  }, [dispatch, statusFilter, restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    socket.emit('join-kitchen-room', restaurantId);

    const handleNewOrder = (order) => {
      dispatch(socketNewOrder(order));
      new Audio('/notification.mp3').play().catch(() => {});
      toast.info(`New Order: Table ${order.tableId}`);
    };

    const handleStatusSync = (data) => dispatch(socketOrderUpdated(data));

    const handleBillRequested = (data) => {
      dispatch(fetchOrders({ status: statusFilter, restaurantId }));
      new Audio('/notification.mp3').play().catch(() => {});
      toast.warning(`Bill requested: Table ${data.tableId}`);
    };

    socket.on('new-order', handleNewOrder); 
    socket.on('ORDER_STATUS_UPDATED', handleStatusSync);
    socket.on('bill-requested', handleBillRequested);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('ORDER_STATUS_UPDATED', handleStatusSync);
      socket.off('bill-requested', handleBillRequested);
    };
  }, [restaurantId, dispatch, statusFilter]);

  const urgencyGroups = useMemo(() => ({
    pending: orders.filter(o => o.status === 'Pending'),
    preparing: orders.filter(o => o.status === 'Preparing' || o.status === 'Ready'),
    unpaid: orders.filter(o => (o.status === 'Completed' || o.billRequested) && !o.isPaid)
  }), [orders]);

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return o._id?.includes(term) || o.user?.name?.toLowerCase().includes(term) || o.tableId?.toString().includes(term);
  });

  const handleStatusUpdate = (id, newStatus) => dispatch(updateOrderStatus({ id, status: newStatus }));
  const handleMarkAsPaid = (id) => { setSelectedOrderId(id); setIsConfirmOpen(true); };
  const handleConfirmPaid = () => {
    if (selectedOrderId) {
      dispatch(updateOrderStatus({ id: selectedOrderId, isPaid: true }));
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="relative p-6 min-h-screen max-w-full rounded-[2.5rem] bg-gradient-to-br from-green-50 via-green-100 to-blue-100 font-sans">
      
      {/* Dynamic Background Orbs */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-indigo-300/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[45%] h-[45%] bg-emerald-300/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-full mx-auto">
        {/* Top Header */}
        <header className="py-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              {activeTab === 'kanban' ? 'Kitchen Intelligence' : 'Order Archive'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Activity size={14} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Live Cloud Sync Active</span>
            </div>
          </div>
          <button onClick={() => dispatch(fetchOrders({ status: statusFilter, restaurantId }))}
            className="p-4 bg-white/40 backdrop-blur-xl rounded-[1.5rem] shadow-xl border border-white/60 hover:bg-white/60 transition-all hover:-translate-y-1">
            <RefreshCw size={22} className={isLoading ? "animate-spin text-indigo-600" : "text-slate-600"} />
          </button>
        </header>

        {/* View Switcher: Kanban Layout */}
        {activeTab === 'kanban' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 max-w-full">
            {[
              { title: 'New & Incoming', icon: <AlertCircle size={18}/>, data: urgencyGroups.pending, color: 'text-amber-600', type: 'pending', glow: 'bg-amber-400/10' },
              { title: 'Active Cooking', icon: <ChefHat size={18}/>, data: urgencyGroups.preparing, color: 'text-indigo-600', type: 'preparing', glow: 'bg-indigo-400/10' },
              { title: 'Checkout & Pay', icon: <CreditCard size={18}/>, data: urgencyGroups.unpaid, color: 'text-rose-600', type: 'payment', glow: 'bg-rose-400/10' }
            ].map((lane) => (
              <div key={lane.title} className={`relative flex flex-col max-h-full ] p-4 rounded-[2.5rem] backdrop-blur-xl bg-white/20 border border-white/40 shadow-2xl ${lane.glow}`}>
                <div className="flex justify-between items-center px-4 mb-6">
                  <h3 className={`flex items-center gap-2 font-black uppercase italic tracking-widest text-xs ${lane.color}`}>
                    {lane.icon} {lane.title}
                  </h3>
                  <span className="bg-white/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black shadow-sm border border-white/50">{lane.data.length}</span>
                </div>
                <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-6">
                  {lane.data.length === 0 ? (
                    <div className="h-full rounded-3xl border-2 border-dashed border-white/40 flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                      <BadgeCheck size={32} />
                      <span className="font-black italic text-[10px] uppercase tracking-widest">Station Clear</span>
                    </div>
                  ) : (
                    lane.data.map(order => <OrderCard key={order._id} order={order} type={lane.type} onStatusUpdate={handleStatusUpdate} onMarkAsPaid={handleMarkAsPaid} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Layout with Glass Effects */
          <div className="space-y-6 pb-24">
            <div className="flex flex-col md:flex-row gap-4 bg-white/30 p-4 rounded-[2rem] backdrop-blur-2xl border border-white/60 shadow-xl">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search orders, tables or customers..." 
                  className="w-full pl-14 pr-6 py-4 bg-white/40 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium placeholder:text-slate-400" 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="px-8 py-4 bg-white/40 rounded-2xl border-none font-black text-xs text-slate-700 uppercase tracking-widest" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="backdrop-blur-3xl bg-white/30 rounded-[3rem] shadow-2xl overflow-hidden border border-white/50">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/40">
                    <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Reference</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Customer</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Table</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-white/40 transition-all group">
                      <td className="px-10 py-6 font-black text-indigo-600 text-sm italic underline decoration-indigo-200 underline-offset-4">
                        #{order._id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-10 py-6 font-bold text-slate-700">{order.user.name}</td>
                      <td className="px-10 py-6 font-black text-slate-900">TABLE {order.tableId}</td>
                      <td className="px-10 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black border tracking-widest ${order.isPaid ? 'bg-emerald-400/20 text-emerald-700 border-emerald-300/50' : 'bg-rose-400/20 text-rose-700 border-rose-300/50'}`}>
                          {order.isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button onClick={() => navigate(`/orders/${order._id}`)} 
                          className="p-3 bg-white/60 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-white/50">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Floating Navigation Dock */}
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit max-w-md px-4 z-[100]">
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-full p-2.5 flex justify-between items-center shadow-2xl border border-white/10 ring-1 ring-white/5">
            <button onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-500 ${activeTab === 'kanban' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              <LayoutGrid size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Board</span>
            </button>
            <button onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-500 ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              <List size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Archive</span>
            </button>
            {/*<button onClick={() => navigate('/staff')}
              className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white transition-all">
              <BadgeCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Staff</span>
            </button>*/}
          </div>
        </nav>

        <ConfirmModal 
          isOpen={isConfirmOpen} 
          onClose={() => setIsConfirmOpen(false)} 
          onConfirm={handleConfirmPaid}
          title="Confirm Transaction"
          message="Verify this payment to finalize the order. This will sync status to the customer device and kitchen history."
        />
      </div>
    </div>
  );
};

export default OrderListPage;