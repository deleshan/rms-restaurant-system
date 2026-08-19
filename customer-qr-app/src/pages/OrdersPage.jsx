import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

import { fetchCustomerOrders } from '../features/orders/orderThunks';
import {
  selectOrderState,
  selectOrderProgressStep,
  selectIsPaid,
} from '../features/orders/orderSelectors';
import { selectCustomer, selectTableId, selectRestaurantId } from '../features/auth/authSelectors';

const STATUS_STEPS = ['Pending', 'Preparing', 'Ready', 'Served'];

const STATUS_STYLES = {
  Pending:   'bg-indigo-100 text-indigo-700',
  Preparing: 'bg-amber-100  text-amber-700',
  Ready:     'bg-green-100  text-green-700',
  Served:    'bg-gray-100   text-gray-600',
  Cancelled: 'bg-red-100    text-red-600',
};

const OrdersPage = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const { current: currentOrder, past: pastOrders, loading, error } = useSelector(selectOrderState);
  const customer     = useSelector(selectCustomer);
  const tableId      = useSelector(selectTableId);
  const progressStep = useSelector(selectOrderProgressStep);
  const isPaid       = useSelector(selectIsPaid);
  const restaurantId = useSelector(selectRestaurantId);

  // Prevent double fetch on strict mode / re-renders
  const hasFetched = useRef(false);

  // Fetch orders once on mount 
  useEffect(() => {
    if (customer?.phone && restaurantId && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchCustomerOrders({ phone: customer.phone, restaurantId }));
    }
  }, [customer?.phone, restaurantId]);


  useEffect(() => {
    
    if (isPaid || currentOrder?.status === 'Served') {
      const timer = setTimeout(() => {
        navigate('/review');
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [isPaid, currentOrder?.status, navigate]);

  // Helpers 
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day:   'numeric',
    });
  };

  const formatAmount = (order) => {
    const amount = order?.totalPrice || order?.totalAmount || 0;
    return `Rs. ${Number(amount).toFixed(2)}`;
  };

  // Render 
  if (loading) return <LoadingSpinner message="Tracking your order..." />;
  if (error)   return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Order History</h1>

        {/*CURRENT ORDER  */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">
            Current Order
          </h2>

          {currentOrder ? (
            <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="p-6">

                {/* Table + Status Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold text-gray-400 block uppercase">Table</span>
                    <span className="text-xl font-black text-gray-800">
                      {currentOrder.tableId || tableId || 'N/A'}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${
                    STATUS_STYLES[currentOrder.status] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {currentOrder.status}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-3">
                  {STATUS_STEPS.map((step, idx) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                        idx <= progressStep ? 'bg-indigo-600' : 'bg-gray-100'
                      }`}
                    />
                  ))}
                </div>

                {/* Status Message */}
                <p className="text-xs text-gray-400 text-center mb-6">
                  {currentOrder.status === 'Pending'   && '⏳ Your order has been received'}
                  {currentOrder.status === 'Preparing' && '🍳 Kitchen is preparing your order'}
                  {currentOrder.status === 'Ready'     && '✅ Your order is ready!'}
                  {currentOrder.status === 'Served'    && '🍽️ Enjoy your meal!'}
                </p>

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {currentOrder.items?.map((item, index) => (
                    <div
                      key={item._id || item.menuItem || index}
                      className="flex justify-between text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-gray-700">
                          <span className="font-bold text-gray-800">
                            {item.qty || item.quantity}x
                          </span>{' '}
                          {item.name}
                        </span>
                        {item.customizations?.length > 0 && (
                          <span className="text-xs text-indigo-400 mt-0.5">
                            {Array.isArray(item.customizations)
                              ? item.customizations.join(', ')
                              : item.customizations}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-gray-800">
                        Rs. {(
                          (item.price || 0) * (item.qty || item.quantity || 1)
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Special Request */}
                {currentOrder.specialRequest && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-700">
                    <span className="font-bold">Special Request: </span>
                    {currentOrder.specialRequest}
                  </div>
                )}

                {/* Total */}
                <div className="pt-4 border-t border-dashed flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-xl font-black text-indigo-600">
                    {formatAmount(currentOrder)}
                  </span>
                </div>

                {/* Payment Notice */}
                <p className="text-center text-xs text-gray-400 mt-4">
                  💳 Please pay with cash or card when staff comes to your table
                </p>

              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-2xl mb-2">🍽️</p>
              <p className="text-gray-500 font-medium text-sm">No active orders</p>
              <p className="text-gray-400 text-xs mt-1">
                Your current order will appear here
              </p>
            </div>
          )}
        </section>

        {/* PAST ORDERS  */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Previous Orders
          </h2>

          {!pastOrders || pastOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-gray-400 text-sm">No past orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                    {order.tableId && (
                      <p className="text-xs text-gray-300 mt-0.5">
                        Table {order.tableId}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="font-black text-gray-800">
                      {formatAmount(order)}
                    </p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'Cancelled'
                        ? 'bg-red-100 text-red-400'
                        : 'bg-green-100 text-green-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <BottomNavigation />
    </div>
  );
};

export default OrdersPage;