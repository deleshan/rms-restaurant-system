import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Rocket } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/common/Button';

const AdminAccountForm = ({ data, update, onSubmit, onBack, isLoading }) => {
  const [showPassword, setShowPassword] = useState(false);

  // Final validation check
  const isFormValid = 
    data.adminEmail?.trim() && 
    data.username?.trim() && 
    data.password?.length >= 6;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Administrator Account</h2>
          <p className="text-sm text-gray-500">Create your login credentials for the Admin Portal.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="User Name"
          name="adminName"
          value={data.username}
          onChange={(e) => update({ username: e.target.value })}
          placeholder="e.g. kamal Hassan"
          leftIcon={<User className="text-gray-400" size={18} />}
          disabled={isLoading}
        />

        <Input
          label="Admin Email Address"
          type="email"
          name="adminEmail"
          value={data.adminEmail}
          onChange={(e) => update({ adminEmail: e.target.value })}
          placeholder="admin@yourrestaurant.com"
          leftIcon={<Mail className="text-gray-400" size={18} />}
          disabled={isLoading}
          autoComplete="off"
        />

        <div className="relative">
          <Input
            label="Create Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={data.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="••••••••"
            leftIcon={<Lock className="text-gray-400" size={18} />}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] text-gray-400 hover:text-indigo-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <p className="mt-1.5 text-xs text-gray-500">
            Must be at least 6 characters long.
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Note:</strong> By clicking "Create My Restaurant", you agree to our Terms of Service. This email will be your primary login for the Admin Dashboard.
          </p>
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            <ArrowLeft size={18} /> Back
          </Button>
          <Button
            type="submit"
            disabled={!isFormValid || isLoading}
            loading={isLoading}
            className="flex-1 flex items-center justify-center gap-2 text-brand hover:text-white"
          >
            {isLoading ? 'Setting up...' : 'Create My Restaurant'}
            {!isLoading && <Rocket size={18} />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminAccountForm;