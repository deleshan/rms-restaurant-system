import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, User, Terminal, LogIn } from 'lucide-react';

// Import Thunks and Actions
import { loginStaff } from '../features/auth/authThunks'; 
import { clearAuthError } from '../features/auth/authSlice';

// UI Components
import Button from '@/components/common/Button';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get auth state from Redux
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    staffId: '', 
    passcode: '', 
    station: 'Full Kitchen'
  });

  // Clear any existing auth errors when the login page is mounted
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
 
  const loginPayload = {
    username: formData.staffId, 
    pin: formData.passcode,      
    station: formData.station
  };

  const resultAction = await dispatch(loginStaff(loginPayload));
  
  if (loginStaff.fulfilled.match(resultAction)) {
    navigate('/live-orders');
  }
};
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
      {/* Decorative Background Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-3xl shadow-2xl shadow-orange-900/40 mb-4 transform -rotate-6">
            <ChefHat className="text-white w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            NeoDemeter
          </h1>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
            Chef<span className="text-orange-500">Node</span> KDS
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">
            Secure Kitchen Terminal Access
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Staff ID Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Restaurant / Staff ID
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type="text"
                  name="staffId"
                  required
                  autoComplete="username"
                  value={formData.staffId}
                  onChange={handleChange}
                  placeholder="Enter ID"
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Passcode Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Security Pin
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                <input
                  type="password"
                  name="passcode"
                  required
                  inputMode="numeric" 
                  autoComplete="current-password"
                  value={formData.passcode}
                  onChange={handleChange}
                  placeholder="••••"
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold tracking-[0.5em] focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Station Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Assign Station
              </label>
              <div className="relative group">
                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={20} />
                <select
                  name="station"
                  value={formData.station}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="Full Kitchen">Full Kitchen Feed</option>
                  <option value="Grill">Grill Station</option>
                  <option value="Salad">Salad/Cold Station</option>
                  <option value="Dessert">Dessert Station</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 p-3 rounded-xl flex items-center gap-3 text-rose-500 text-sm font-bold animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="xl" 
              className="w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">Connecting...</span>
              ) : (
                <>
                  <LogIn size={20} />
                  START SHIFT
                </>
              )}
            </Button>
          </form>
        </div>

        {/* System Info */}
        <p className="text-center text-slate-600 text-[10px] font-bold mt-8 uppercase tracking-[0.3em]">
          V 2.4.0 — Local Terminal Secured
        </p>
      </div>
    </div>
  );
};

export default Login;