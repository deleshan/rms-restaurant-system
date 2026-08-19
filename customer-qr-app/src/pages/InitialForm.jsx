import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setTableId, setRestaurantId, clearAuthError } from '../features/auth/authSlice'; 
import { submitInitialForm } from '../features/auth/authThunks';
import { selectAuthError, selectAuthLoading, selectIsAuthenticated, selectCustomerHomeRestaurantId } from '../features/auth/authSelectors';
import { cn } from '@/utils/cn';

const InitialForm = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Extract context from URL (rid = RestaurantID, t = TableNo)
  const tableId = searchParams.get('t') || (import.meta.env.DEV ? 'DEV-TABLE-01' : 'Unknown');
  const restaurantId = searchParams.get('rid') || (import.meta.env.DEV ? '699d521d6f0a542e02cdf644' : null);

  // Redux state
  const loading = useSelector(selectAuthLoading);
  const serverError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const customerHomeRestaurantId = useSelector(selectCustomerHomeRestaurantId);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    address: '',
  });

  const [errors, setErrors] = useState({});

  // Initialize Session & Clear old errors on mount
 useEffect(() => {
    dispatch(clearAuthError());

    const currentTable = searchParams.get('t');
    const currentRestaurant = searchParams.get('rid');

    if (currentTable) dispatch(setTableId(currentTable));
    if (currentRestaurant) dispatch(setRestaurantId(currentRestaurant));

    const effectiveRID = currentRestaurant || restaurantId;
    const effectiveTID = currentTable || tableId;
    
    const belongsToThisRestaurant =
      isAuthenticated &&
      customerHomeRestaurantId &&
      effectiveRID &&
      customerHomeRestaurantId === effectiveRID;

    if (belongsToThisRestaurant && effectiveRID && effectiveTID && effectiveTID !== 'Unknown') {
      navigate('/menu');
    }
}, [dispatch, searchParams, isAuthenticated, customerHomeRestaurantId, navigate, restaurantId, tableId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // SANITIZATION: If phone, keep only numbers and limit to 10 digits
    let finalValue = value;
    if (name === 'phone') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData({ ...formData, [name]: finalValue });

    // Clear validation error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Safety check for restaurantId (required for backend)
    if (!restaurantId || restaurantId === 'null') {
      newErrors.general = "Restaurant context is missing. Please re-scan the QR code on your table.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Submit to backend via the Unified Thunk
    const resultAction = await dispatch(submitInitialForm({
      ...formData,
      tableId,
      restaurantId 
    }));

    if (submitInitialForm.fulfilled.match(resultAction)) {
      navigate('/menu');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Container with Brand-aligned Glassmorphism */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 md:p-10 border border-white relative overflow-hidden">
        
        {/* Subtle Brand Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand/10 rounded-full blur-3xl" />
        
        {/* Header Icon */}
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mb-4 transform -rotate-3 shadow-lg shadow-brand/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Table Check-in</h1>
          <p className="text-brand font-black bg-brand/10 inline-block px-4 py-1 rounded-full text-xs mt-2 uppercase tracking-widest">
            Table {tableId}
          </p>
        </div>

        {/* Error Feedback */}
        {(serverError || errors.general) && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 rounded-r-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {errors.general || (typeof serverError === 'string' ? serverError : serverError.message)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Name Field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name *</label>
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={cn(
                "w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-4 transition-all outline-none font-medium",
                errors.name ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:ring-brand/10 focus:border-brand/40'
              )}
            />
            {errors.name && <p className="text-rose-500 text-[10px] mt-1 font-black uppercase ml-1">{errors.name}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0771234567"
              className={cn(
                "w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-4 transition-all outline-none font-medium",
                errors.phone ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:ring-brand/10 focus:border-brand/40'
              )}
            />
            {errors.phone && <p className="text-rose-500 text-[10px] mt-1 font-black uppercase ml-1">{errors.phone}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email (Optional)</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@email.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand/10 focus:border-brand/40 outline-none transition-all font-medium"
            />
          </div>

          {/* Birthday Field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Date of Birth (Optional)</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand/10 focus:border-brand/40 outline-none transition-all text-slate-600 font-medium"
            />
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Address (Optional)</label>
            <textarea
              name="homeAddress"
              value={formData.homeAddress}
              onChange={handleChange}
              placeholder="Your delivery address..."
              rows="2"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand/10 focus:border-brand/40 outline-none transition-all font-medium resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full font-black text-sm py-4 rounded-2xl shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 mt-4 uppercase tracking-widest",
              loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-brand text-white shadow-brand/40 hover:opacity-90'
            )}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Identifying...</span>
              </>
            ) : (
              <>
                <span>Start Ordering</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 mt-8 uppercase tracking-[0.2em] font-black">
          Powered by Restaurant OS
        </p>
      </div>
    </div>
  );
};

export default InitialForm;