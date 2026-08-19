import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile, updateProfile } from '../features/profile/profileThunks';
import { selectProfileState } from '../features/profile/profileSelector';
import { selectRestaurantId } from '../features/auth/authSelectors';
import api from '../utils/api';
import { persistor } from '../store/store';

import BottomNavigation from '../components/BottomNavigation';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfilePage = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const { profile, points, tier, loading } = useSelector(selectProfileState);
  const restaurantId = useSelector(selectRestaurantId);

  // Local UI State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '' });
  
  // Orders State
  const [orders, setOrders] = useState({ active: [], past: [] });
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    if (profile.phone && restaurantId) {
      dispatch(fetchProfile(profile.phone));
      fetchHistory();
    }
  }, [dispatch, profile.phone, restaurantId]);

  const fetchHistory = async () => {
    if (!profile.phone || !restaurantId) return;

    setOrdersLoading(true);
    try {
      const response = await api.getCustomerOrders(profile.phone, restaurantId);
      const rawData = response.data || response;
      setOrders({
        active: rawData.current ? [rawData.current] : [],
        past: Array.isArray(rawData.past) ? rawData.past : [],
      });
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Profile Editing Logic
  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({ name: profile.name, email: profile.email });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    const resultAction = await dispatch(updateProfile({ 
      phone: profile.phone, 
      updates: editData 
    }));
    
    if (updateProfile.fulfilled.match(resultAction)) {
      setIsEditing(false);
    }
  };
  const handleLogout = () => {
  persistor.purge(); 
  window.location.href = '/login';
};

  // Stats Calculation
  const allOrdersList = [...(orders.active || []), ...(orders.past || [])];
  const totalSpent = allOrdersList.reduce((sum, order) => {
    return sum + (order.totalAmount || 0);
  }, 0);

  if (loading && !profile.name) return <LoadingSpinner message="Loading your profile..." />;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black tracking-tight">Profile</h1>
          <div className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
            {tier || 'Bronze'}
          </div>
        </header>

        {/* Loyalty & Spend Card  */}
        <div className="bg-gray-900 rounded-[2.5rem] p-8 mb-6 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Available Points</p>
                <h2 className="text-4xl font-black">{points || 0}</h2>
              </div>
              <button 
                onClick={fetchHistory}
                disabled={ordersLoading}
                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all active:scale-90 disabled:opacity-50"
              >
                <svg className={`w-6 h-6 text-indigo-400 ${ordersLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="flex gap-8 border-t border-white/10 pt-6">
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Total Spend</p>
                <p className="font-bold text-lg">Rs. {totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Orders</p>
                <p className="font-bold text-lg">{allOrdersList.length}</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-20"></div>
        </div>

        {/* Account Details Card  */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Account Info</h2>
            <button
              onClick={handleEditToggle}
              className="px-4 py-2 rounded-xl text-indigo-600 font-bold text-sm bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Info'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="Name"
              />
              <input
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="Email"
              />
              <button
                onClick={handleSave}
                className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                  {profile.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Full Name</p>
                  <p className="font-bold text-gray-900 text-lg">{profile.name || 'User'}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Phone</p>
                  <p className="font-bold text-gray-900 text-lg">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email</p>
                  <p className="font-bold text-gray-900 text-lg">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Date of Birth</p>
                  <p className="font-bold text-gray-900 text-lg">{profile.dateOfBirth}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/*  Active/Live Orders Section  */}
        {orders.active.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Live Orders ({orders.active.length})
              </h2>
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
            </div>
            {orders.active.map((order) => (
              <div key={order._id} className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-lg flex justify-between items-center">
                <div>
                  <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {order.orderNumber} • {order.itemsCount || order.items?.length} Items
                  </p>
                  <h3 className="font-black text-lg leading-tight">{order.status}</h3>
                  <p className="text-indigo-200 text-xs mt-1">Table: {order.tableId}</p>
                </div>
                <div className="text-right">
                   <p className="font-black text-white text-lg">Rs. {order.totalAmount}</p>
                   <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Preparing...</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past Orders (History) Section  */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-black text-gray-800 tracking-tight mb-8">Order History</h2>
          
          {ordersLoading && orders.past.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3">
               <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
               <p className="text-gray-400 text-sm font-bold">Loading history...</p>
            </div>
          ) : orders.past.length > 0 ? (
            <div className="space-y-8">
              {orders.past.map((order) => (
                <div key={order._id} className="flex justify-between items-center">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 font-bold">
                        {order.itemsCount || order.items?.length || 0}
                     </div>
                     <div>
                        <p className="font-black text-gray-900">{order.orderNumber || 'Order'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 text-lg">Rs. {order.totalAmount}</p>
                    <p className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400 font-bold">No past orders yet.</p>
            </div>
          )}
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;