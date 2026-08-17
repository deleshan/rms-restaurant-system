import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrderById,
  updateOrderStatus,
  cancelOrder,
} from '@/features/orders/orderThunks';
import {
  selectOrdersLoading,
  selectOrdersError,
} from '@/features/orders/orderSelector';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmModal from '@/components/common/ConfirmModal';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Calendar,
  Zap,
  UtensilsCrossed,
  Phone,
} from 'lucide-react';

const STATUS_STYLES = {
  Pending:   'bg-amber-100 text-amber-700',
  Preparing: 'bg-blue-100 text-blue-700',
  Ready:     'bg-indigo-100 text-indigo-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const STATUS_STEPS = ['Pending', 'Preparing', 'Ready', 'Completed'];

const OrderDetails = () => {
  const { id }    = useParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  
  // Modal States
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState(null);

  const loading = useSelector(selectOrdersLoading);
  const error   = useSelector(selectOrdersError);
  const order = useSelector((state) => state.orders.selectedOrder);

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id]);

  const handleStatusUpdate = (status) => {
    dispatch(updateOrderStatus({ id: order._id, status }));
    setStatusToUpdate(null);
  };

  const handleCancel = () => {
    dispatch(cancelOrder({ id: order._id, reason: 'Admin Manual Cancel' }));
    setShowCancelModal(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleTimeString([], {
      hour:   '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString([], {
      month:  'short',
      day:    'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-500 text-sm">Retrieving order data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <p className="text-rose-500 font-medium">{error}</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} className="mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  if (!order || order._id !== id) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Order not found</p>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} className="mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      
      {/* Modals */}
      <ConfirmModal 
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onConfirm={() => dispatch(updateOrderStatus({ id: order._id, status: 'Completed', isPaid: true }))}
        title="Confirm Payment"
        message="Are you sure you want to mark this order as PAID? This will update your financial reports."
        confirmText="Yes, Mark as Paid"
        variant="warning"
      />

      <ConfirmModal 
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Order?"
        message="This will notify the customer and remove the order from the active queue. This action cannot be undone."
        confirmText="Cancel Order"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={!!statusToUpdate}
        onClose={() => setStatusToUpdate(null)}
        onConfirm={() => handleStatusUpdate(statusToUpdate)}
        title={`Update to ${statusToUpdate}?`}
        message={`Are you sure you want to change the order status to ${statusToUpdate}?`}
        confirmText="Update Status"
        variant="primary"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order._id?.slice(-6).toUpperCase()}
          </h1>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'
          }`}>
            {order.status}
          </span>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} className="mr-2" /> Print Bill
        </Button>
      </div>

      {/* Progress Bar */}
      {order.status !== 'Cancelled' && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            {STATUS_STEPS.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    idx <= currentStep
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {idx < currentStep ? <CheckCircle size={14} /> : idx + 1}
                  </div>
                  <span className="text-xs text-gray-500 hidden md:block">{step}</span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${
                    idx < currentStep ? 'bg-indigo-600' : 'bg-gray-100'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content  */}
        <div className="lg:col-span-2 space-y-6">

          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Customer & AI Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium">{order.user?.name || 'Guest Customer'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span>{order.user?.phone || 'N/A'}</span>
                </div>
                {order.user?.segment && (
                  <div className="flex items-center gap-2">
                    <Zap size={15} className="text-purple-500" />
                    <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                      AI Segment: {order.user.segment}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <UtensilsCrossed size={16} className="text-gray-400" />
                  <span>Table: <span className="font-medium">{order.tableId || 'N/A'}</span></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span>{formatDateTime(order.createdAt)}</span>
                </div>
                {order.specialRequest && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                    <span className="font-bold">Special Request: </span>
                    {order.specialRequest}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Order Items</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Item</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500">Customizations</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 text-center">Qty</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 text-right">Price</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-gray-500 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item, i) => (
                  <tr key={item._id || i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800 text-sm">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-indigo-500">
                      {Array.isArray(item.customizations) && item.customizations.length > 0
                        ? item.customizations.join(', ')
                        : item.customizations || '—'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {item.qty || item.quantity || 1}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      LKR {(item.price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                      LKR {((item.price || 0) * (item.qty || item.quantity || 1)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-right font-bold text-gray-700">
                    Total Amount
                  </td>
                  <td className="px-6 py-4 text-right font-black text-indigo-600 text-lg">
                    LKR {(order.totalPrice || 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">

              {order.status === 'Pending' && (
                <button
                  onClick={() => setStatusToUpdate('Preparing')}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl transition"
                >
                  <Clock size={16} /> Start Preparing
                </button>
              )}

              {order.status === 'Preparing' && (
                <button
                  onClick={() => setStatusToUpdate('Ready')}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition"
                >
                  <CheckCircle size={16} /> Mark as Ready
                </button>
              )}

              {order.status === 'Ready' && (
                <button
                  onClick={() => setStatusToUpdate('Completed')}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition"
                >
                  <CheckCircle size={16} /> Complete Order
                </button>
              )}

              {order.status === 'Completed' && !order.isPaid && (
                <button
                  onClick={() => setShowPayModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-amber-100 border-b-4 border-amber-700 active:border-b-0"
                >
                  <Zap size={18} /> Confirm Payment
                </button>
              )}

              {['Pending', 'Preparing'].includes(order.status) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold py-2.5 px-4 rounded-xl transition border border-rose-200"
                >
                  <XCircle size={16} /> Cancel Order
                </button>
              )}

              {((order.status === 'Completed' && order.isPaid) || order.status === 'Cancelled') && (
                <div className="text-center p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Order Finalized
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4">Timeline</h3>
            <div className="space-y-4 border-l-2 border-gray-100 ml-2 pl-4">
              <div className="relative">
                <div className="absolute -left-[21px] bg-white border-2 border-indigo-500 w-3 h-3 rounded-full" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Order Placed</p>
                <p className="text-sm font-medium text-gray-700">{formatDateTime(order.createdAt)}</p>
              </div>

              {order.prepStartTime && (
                <div className="relative">
                  <div className="absolute -left-[21px] bg-white border-2 border-blue-400 w-3 h-3 rounded-full" />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Preparing Started</p>
                  <p className="text-sm font-medium text-gray-700">{formatTime(order.prepStartTime)}</p>
                </div>
              )}

              {order.readyTime && (
                <div className="relative">
                  <div className="absolute -left-[21px] bg-white border-2 border-indigo-400 w-3 h-3 rounded-full" />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Ready for Pickup</p>
                  <p className="text-sm font-medium text-gray-700">{formatTime(order.readyTime)}</p>
                </div>
              )}

              {order.completedTime && (
                <div className="relative">
                  <div className="absolute -left-[21px] bg-white border-2 border-emerald-500 w-3 h-3 rounded-full" />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Completed</p>
                  <p className="text-sm font-medium text-gray-700">{formatTime(order.completedTime)}</p>
                </div>
              )}

              {order.status === 'Cancelled' && (
                <div className="relative">
                  <div className="absolute -left-[21px] bg-white border-2 border-rose-400 w-3 h-3 rounded-full" />
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Cancelled</p>
                  {order.cancellationReason && (
                    <p className="text-xs text-rose-500 mt-0.5">{order.cancellationReason}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-gray-800 mb-4">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Method</span>
                <span className="font-medium">{order.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Status</span>
                <span className={`font-bold ${order.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {order.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              {order.billRequested && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-700 text-center font-medium">
                  🧾 Bill has been requested
                </div>
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;