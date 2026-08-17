import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/common/Button';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  UserCog, 
  Tablet,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useDispatch } from 'react-redux';
import { changePassword, toggleTwoFactorAuth, updateKitchenPin } from '@/features/settings/settingsThunks';
import { toast } from '@/components/common/Toast';

// NOTE: formData/handleChange are intentionally only used here for read-only
// display context (e.g. formData.twoFactorAuth initial value from the server).
// Password, PIN, and 2FA changes each keep their OWN local state and are
// submitted independently via dedicated thunks — never through the global
// "Save Global Changes" flow, since updateSettings() no longer accepts
// these fields (see settingsController whitelist).
const SecuritySettings = ({ formData }) => {
  const dispatch = useDispatch();

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSave = async () => {
    if (!pwForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      await dispatch(changePassword(pwForm)).unwrap();
      toast.success('Password updated');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  // Two-Factor Authentication
  const [twoFA, setTwoFA] = useState(formData?.twoFactorAuth || false);
  const [twoFASaving, setTwoFASaving] = useState(false);

  const handleToggle2FA = async () => {
    const next = !twoFA;
    setTwoFA(next); 
    setTwoFASaving(true);
    try {
      await dispatch(toggleTwoFactorAuth(next)).unwrap();
      toast.success(`2FA ${next ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setTwoFA(!next); // revert on failure
      toast.error(err || 'Failed to update 2FA');
    } finally {
      setTwoFASaving(false);
    }
  };

  // Kitchen PIN / Username
  const [showPin, setShowPin] = useState(false);
  const [kitchenUsername, setKitchenUsername] = useState(formData?.kitchenUsername || '');
  const [kitchenPinForm, setKitchenPinForm] = useState({ currentPin: '', newPin: '' });
  const [pinSaving, setPinSaving] = useState(false);

  const handleKitchenPinFieldChange = (e) => {
    const { name, value } = e.target;
    setKitchenPinForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleKitchenPinSave = async () => {
    if (!kitchenPinForm.currentPin) {
      toast.error('Please enter the current PIN');
      return;
    }
    if (!kitchenPinForm.newPin || kitchenPinForm.newPin.length !== 4) {
      toast.error('New PIN must be exactly 4 digits');
      return;
    }
    setPinSaving(true);
    try {
      await dispatch(updateKitchenPin(kitchenPinForm)).unwrap();
      toast.success('Kitchen PIN updated');
      setKitchenPinForm({ currentPin: '', newPin: '' });
    } catch (err) {
      toast.error(err || 'Failed to update kitchen PIN');
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/*  Section 1: Admin Credentials  */}
      <Card 
        title="Administrative Access" 
        subtitle="Credentials required to access this Admin Dashboard and modify system-wide settings."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Current Password" 
              name="currentPassword" 
              type="password"
              value={pwForm.currentPassword} 
              onChange={handlePwChange}
              placeholder="Enter current password"
              icon={UserCog}
            />
            <div className="relative">
              <Input 
                label="New Password" 
                name="newPassword" 
                type={showPassword ? "text" : "password"}
                value={pwForm.newPassword} 
                onChange={handlePwChange}
                placeholder="At least 6 characters"
                icon={Key}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              type="button"
              variant="primary" 
              onClick={handlePasswordSave}
              isLoading={pwSaving}
            >
              Update Password
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
            <Shield className="text-blue-600 shrink-0" size={20} />
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Security Tip:</strong> Use a password that contains at least 12 characters, including numbers and special symbols. Admin access allows full control over financial data.
            </p>
          </div>
        </div>
      </Card>

      {/*  Section 2: Two-Factor Authentication  */}
      <Card 
        title="Two-Factor Authentication" 
        subtitle="Add an extra layer of protection to your admin login."
      >
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <ShieldCheck className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                2FA is currently {twoFA ? 'enabled' : 'disabled'}
              </p>
              <p className="text-[11px] text-slate-500 uppercase font-black tracking-tighter">
                Require a one-time code on top of your password
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={twoFA}
              disabled={twoFASaving}
              onChange={handleToggle2FA}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </Card>

      {/*  Section 3: Kitchen Display System (KDS) Security */}
      <Card 
        title="Kitchen Station Security" 
        subtitle="Manage access for kitchen tablets and the Kitchen Display System."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input 
              label="KDS Login Username" 
              name="kitchenUsername" 
              value={kitchenUsername} 
              onChange={(e) => setKitchenUsername(e.target.value)}
              placeholder="e.g. KITCHEN_STATION_1"
              icon={Tablet}
              disabled
            />
            <p className="text-[10px] text-slate-400 -mt-2">
              Kitchen username changes aren't supported yet from this screen.
            </p>

            <Input 
              label="Current PIN" 
              name="currentPin" 
              type={showPin ? "text" : "password"}
              maxLength={4}
              value={kitchenPinForm.currentPin}
              onChange={handleKitchenPinFieldChange}
              placeholder="Current 4-digit PIN"
              icon={Lock}
            />

            <div className="relative">
              <Input 
                label="New Kitchen Access PIN" 
                name="newPin" 
                type={showPin ? "text" : "password"}
                maxLength={4}
                value={kitchenPinForm.newPin}
                onChange={handleKitchenPinFieldChange}
                placeholder="New 4-digit PIN"
                icon={Lock}
              />
              <button 
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex justify-end">
              <Button 
                type="button"
                variant="primary" 
                onClick={handleKitchenPinSave}
                isLoading={pinSaving}
              >
                Update Kitchen PIN
              </Button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-orange-800 font-bold text-sm mb-2">
              <AlertTriangle size={16} />
              <h4>Why use a PIN?</h4>
            </div>
            <div className="text-xs text-orange-900/80 leading-relaxed">
              In a fast-paced kitchen environment, staff use a 4-digit PIN to:
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Quickly mark items as "86-ed" (Out of Stock)</li>
                <li>Clear orders from the live display</li>
                <li>Authenticate without removing gloves or typing long passwords</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 4: Session Management  */}
      <Card title="Active Sessions">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div>
                <p className="text-sm font-bold text-slate-900">Current Session (Admin Dashboard)</p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Colombo, Sri Lanka • IP: 192.168.1.1</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-black">ACTIVE NOW</Badge>
          </div>
          
          <button className="w-full py-3 text-xs font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all">
            Revoke All Other Sessions
          </button>
        </div>
      </Card>
    </div>
  );
};

export default SecuritySettings;