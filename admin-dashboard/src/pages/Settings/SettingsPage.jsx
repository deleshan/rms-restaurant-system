import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, DollarSign, Shield, CreditCard, Save } from 'lucide-react';

// Sub-sections
import ProfileSettings from './ProfileSettings';
import FinancialSettings from './FinancialSettings';
import SecuritySettings from './SecuritySettings';
import BillingSettings from './BillingSettings';

// UI Components
import Button from '@/components/common/Button';
import { toast } from '@/components/common/Toast';

// Redux Actions & Selectors
import { fetchSettings, updateSettings } from '@/features/settings/settingsSlice';
import { 
  selectSettingsData, 
  selectSettingsLoading, 
  selectIsSettingsInitialized 
} from '@/features/settings/settingsSelector';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const dispatch = useDispatch();
  
  // 1. Selectors from Redux
  const settings = useSelector(selectSettingsData);
  const loading = useSelector(selectSettingsLoading);
  const isInitialized = useSelector(selectIsSettingsInitialized);

  // 2. Initial Form State 
  const [formData, setFormData] = useState({
    restaurantName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    ownerName: '',
    currency: 'LKR',
    taxRate: 0,
    serviceCharge: 0,
    adminUsername: '',
    adminPassword: '', 
    kitchenUsername: '',
    kitchenPin: ''
  });

  // 3. Initial Data Fetch
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  // 4. Sync Redux to Local State
  useEffect(() => {
    if (isInitialized && settings) {
      setFormData((prev) => ({
        ...prev,
        ...settings
      }));
    }
  }, [isInitialized, settings]);

  // 5. Centralized Change Handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  // 6. Save Logic
  const handleSave = async (e) => {
    if (e) e.preventDefault(); 
    
    try {
      await dispatch(updateSettings(formData)).unwrap();
      toast.success('Restaurant settings updated');
    } catch (err) {
      toast.error(err || 'Failed to save changes');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Building2 },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Subscription', icon: CreditCard },
  ];

  // 7. Dynamic Section Renderer
  const renderActiveSection = () => {
    const props = { formData, handleChange, setFormData };

    switch (activeTab) {
      case 'profile': return <ProfileSettings {...props} />;
      case 'financials': return <FinancialSettings {...props} />;
      case 'security': return <SecuritySettings {...props} />;
      case 'billing': return <BillingSettings {...props} />;
      default: return <ProfileSettings {...props} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Restaurant Control
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            System Configuration & Business Identity
          </p>
        </div>
        <Button 
          variant="primary" 
          icon={Save} 
          isLoading={loading}
          onClick={handleSave}
          className="shadow-indigo-200 shadow-lg"
        >
          Save Global Changes
        </Button>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl mb-8 w-fit border border-slate-200 overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      
      <form onSubmit={handleSave} autoComplete="off">
        <div 
          key={activeTab} 
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          {renderActiveSection()}
        </div>
        
        
        <button type="submit" className="hidden" />
      </form>
    </div>
  );
};

export default SettingsPage;