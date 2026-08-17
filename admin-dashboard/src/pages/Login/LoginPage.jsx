import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '@/features/auth/authThunks';
import { clearAuthError } from '@/features/auth/authSlice';

import {
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
  selectCurrentUserRole
} from '@/features/auth/authSelectors';

// UI Components
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Icons
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux State via Selectors
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectCurrentUserRole);

  // Local UI State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && ['admin', 'manager', 'superadmin'].includes(userRole)) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (localError) setLocalError('');
    if (authError) dispatch(clearAuthError());
  };

  const validateForm = () => {
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const resultAction = await dispatch(login({
      email: formData.email.trim(),
      password: formData.password
    }));

    if (login.fulfilled.match(resultAction)) {
      const role = resultAction.payload.user.role?.toLowerCase();
      
      if (['admin', 'manager', 'superadmin'].includes(role)) {
        navigate('/dashboard');
      } else {
        // Handle Role-Based Access Control for the Admin Frontend
        setLocalError('Access Denied: This portal is for Administrators only.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Back to Home Link */}
      <Link 
        to="/" 
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Website
      </Link>

      <Card className="w-full max-w-md shadow-xl border-t-4 border-indigo-600 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Please sign in to manage your restaurant</p>
        </div>

        {/* Error Feedback */}
        {(authError || localError) && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>
              {localError || 
              (typeof authError === 'object' ? authError.message || 'An error occurred' : authError)}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@restaurant.com"
            leftIcon={<Mail className="text-gray-400" size={18} />}
            disabled={isLoading}
          />

          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={<Lock className="text-gray-400" size={18} />}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-indigo-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button
            variant="primary"
            type="submit"
            className="w-full mt-2 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 px-6 rounded-2xl"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Enter Dashboard'}
          </Button>
        </form>

        {/* Landing Page Strategy Implementation */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Own a restaurant?{' '}
            <Link 
              to="/register-restaurant" 
              className="text-indigo-600 font-bold hover:underline"
            >
              Register your business here
            </Link>
          </p>
          <p className="mt-4 text-xs text-gray-400">
            For support, contact <Link to="/support" className="hover:text-gray-600 underline">System Administration</Link>
          </p>
        </div>
      </Card>
      
      {/* Branding Footer */}
      <p className="mt-8 text-gray-400 text-xs uppercase tracking-widest font-semibold">
        Powered by RestoSync SaaS
      </p>
    </div>
  );
};

export default LoginPage;