import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { placeOrder } from '../features/orders/orderThunks';
import {
  updateItemQuantity,
  removeFromCart,
  clearCart,
  setSpecialRequest,
  updateItemCustomizations,
} from '../features/cart/cartSlice';
import {
  selectCartItems,
  selectCartTotal,
  selectSpecialRequest,
} from '../features/cart/cartSelectors';
import {
  selectCustomer,
  selectTableId,
  selectRestaurantId,
} from '../features/auth/authSelectors';

import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CustomizationModal from '../components/CustomizationModal';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const cartItems      = useSelector(selectCartItems);
  const total          = useSelector(selectCartTotal);
  const specialRequest = useSelector(selectSpecialRequest);
  const customer       = useSelector(selectCustomer);
  const tableId        = useSelector(selectTableId);
  const restaurantId   = useSelector(selectRestaurantId);

  const handleQtyChange = (id, customizations, newQty) => {
    if (newQty < 1) return;
    dispatch(updateItemQuantity({ id, customizations, qty: newQty }));
  };

  const handleRemove = (id, customizations) => {
    dispatch(removeFromCart({ id, customizations }));
  };

  const handleAIUpdateConfirm = (newCustomizationData) => {
    if (editingItem) {
      dispatch(
        updateItemCustomizations({
          id: editingItem.id || editingItem._id,
          oldCustomizations: editingItem.customizations, 
          newCustomizations: newCustomizationData,    
        })
      );
    }
    setEditingItem(null);
  };

  const handlePlaceOrder = async () => {
    setError(null);
    if (cartItems.length === 0) { setError('Your cart is empty!'); return; }
    if (!customer?.phone || !tableId || !restaurantId) {
      setError('Session data missing. Please re-scan QR.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        restaurantId,
        tableId,
        customer: {
          name: customer?.name || 'Guest',
          phone: customer?.phone || '',
          email: customer?.email || '',
        },
        items: cartItems.map((item) => ({
          menuItemId: item._id || item.id,
          name: item.name,
          price: item.price,
          qty: item.qty || item.quantity || 1,
          customizations: Array.isArray(item.customizations) ? item.customizations : [],
        })),
        totalPrice: total,
        specialRequest: specialRequest?.trim() || '',
      };

      const resultAction = await dispatch(placeOrder(orderData));
      if (placeOrder.fulfilled.match(resultAction)) {
        dispatch(clearCart());
        navigate('/orders');
      } else {
        setError(resultAction.payload || 'Failed to place order.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Dispatching to kitchen..." />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter">
          Review <span className="text-brand">Cart</span>
        </h1>

        {error && <ErrorMessage message={error} />}

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl shadow-slate-200/50">
            <div className="bg-white/60 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-8">Your cart is feeling light</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-brand text-white font-black py-4 px-12 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-white hover:text-brand active:scale-95 transition-all uppercase tracking-widest text-xs"
            >
              Back to Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/*  Cart Items List*/}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={`${item.id || item._id}-${JSON.stringify(item.customizations)}`}
                  className="bg-white/60 backdrop-blur-md rounded-[2rem] p-5 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex justify-between items-center group"
                >
                  <div className="flex-1">
                    <h3 className="font-black text-slate-800 uppercase italic tracking-tight">{item.name}</h3>
                    
                    {item.customizations && item.customizations.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.customizations.map((text, index) => (
                          <span 
                            key={index} 
                            className="flex items-center gap-1 text-[10px] font-bold text-brand bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-left-2"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 014-2.906z" />
                            </svg>
                            {text}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1 italic">Standard Preparation</p>
                    )}

                    <p className="text-sm font-black text-slate-400 mt-3 tracking-tight">
                      Rs. {item.price}
                    </p>
                  </div>
                  

                  <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 bg-indigo-50 text-brand rounded-xl border border-indigo-100 hover:bg-white transition-all relative"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                        </span>
                      </button>
                      <button
                        onClick={() => handleRemove(item.id || item._id, item.customizations)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      </div>

                    <div className="flex items-center bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-1.5 shadow-sm">
                      <button
                        onClick={() => handleQtyChange(item.id || item._id, item.customizations, (item.qty || item.quantity) - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-indigo-600 font-black hover:bg-slate-50 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xs font-black w-10 text-center text-slate-700">
                        {item.qty || item.quantity}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item.id || item._id, item.customizations, (item.qty || item.quantity) + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-indigo-600 font-black hover:bg-slate-50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>

            {/* Special Instructions  */}
            <div className="mt-8">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-3 block">
                Cooking Notes
              </label>
              <textarea
                placeholder="Any allergies or preferences?"
                className="w-full rounded-[1.5rem] border-white/60 border bg-white/40 backdrop-blur-sm p-5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none shadow-sm"
                rows="2"
                value={specialRequest}
                onChange={(e) => dispatch(setSpecialRequest(e.target.value))}
              />
            </div>

            {/* Total Summary Section  */}
            <div className="relative mt-10 p-1 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2.5rem] shadow-2xl shadow-indigo-200">
               <div className="bg-indigo-600/20 backdrop-blur-xl rounded-[2.4rem] p-8 text-white border border-white/20">
                <div className="flex justify-between items-center mb-4 opacity-70 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span>Subtotal</span>
                  <span className="text-sm tracking-normal">Rs. {total}</span>
                </div>
                <div className="flex justify-between items-center pt-5 border-t border-white/10">
                  <span className="font-black text-xl uppercase italic tracking-tighter">Grand Total</span>
                  <div className="text-right">
                    <p className="text-3xl font-black tracking-tighter italic">
                      <span className="text-xs not-italic font-sans mr-1 opacity-70">Rs.</span>
                      {total}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/*  Checkout Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full group relative overflow-hidden bg-slate-900 text-white font-black text-sm py-6 rounded-[2rem] shadow-2xl transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-4 disabled:opacity-50 uppercase tracking-widest"
            >
              <span className="relative z-10">Confirm Order</span>
              <svg className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>

          </div>
        )}
        
          </main>
          {editingItem && (
            <CustomizationModal
              item={editingItem}
              onClose={() => setEditingItem(null)}
              onConfirm={handleAIUpdateConfirm}
            />
          )}

      <BottomNavigation />
    </div>
  );
};

export default CartPage;