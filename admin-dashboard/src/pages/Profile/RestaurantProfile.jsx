import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  Clock, Hash, Edit3, Camera 
} from 'lucide-react';

// UI Components
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

// Redux Actions & Selectors
import { fetchSettings } from '@/features/settings/settingsSlice';
import { selectSettingsData, selectIsSettingsInitialized } from '@/features/settings/settingsSelector';

const RestaurantProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const settings = useSelector(selectSettingsData);
  const isInitialized = useSelector(selectIsSettingsInitialized);

  // Initial Data Fetch
  useEffect(() => {
    if (!isInitialized) {
      dispatch(fetchSettings());
    }
  }, [dispatch, isInitialized]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER / COVER SECTION */}
      <div className="relative h-56 w-full bg-gradient-to-r from-brand to-lightBrand rounded-[2.5rem] overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Profile Avatar Overlay */}
        <div className="absolute -bottom-12 left-10 flex items-end gap-6 pb-10 ">
          <div className="relative group">
            <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-2xl mb-4">
              <div className="w-full h-full bg-slate-100 rounded-[1.4rem] flex items-center justify-center text-slate-400 overflow-hidden border border-slate-100 ">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="object-cover w-full h-full" />
                ) : (
                  <Building2 size={48} className="text-slate-300" />
                )}
              </div>
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={16} />
            </button>
          </div>

          <div className="mb-4 pb-2">
            <h1 className="text-3xl font-black text-white drop-shadow-md">
              {settings?.restaurantName || 'Loading Restaurant...'}
            </h1>
            <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Operational • {settings?.cuisineType || 'General Cuisine'}
            </p>
          </div>
        </div>

        <div className="absolute top-6 right-8">
          <Button 
            variant="white" 
            icon={Edit3} 
            size="sm" 
            className="rounded-xl font-bold text-white shadow-xl"
            onClick={() => navigate('/settings')} 
          >
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
        
        {/*  LEFT COLUMN: QUICK INFO  */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-slate-50 p-6">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Contact Details</h3>
            <ul className="space-y-4">
              <InfoItem icon={Mail} label="Business Email" value={settings?.email} />
              <InfoItem icon={Phone} label="Phone Number" value={settings?.phone} />
              <InfoItem icon={MapPin} label="Address" value={settings?.address} isMultiLine />
            </ul>
          </Card>

          <Card className="border-none shadow-sm bg-indigo-50/50 p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">System Identity</h3>
            <ul className="space-y-4">
              <InfoItem icon={Hash} label="Registration / TIN" value={settings?.taxId || 'Not Configured'} />
              <InfoItem icon={Globe} label="Primary Currency" value={settings?.currency} />
            </ul>
          </Card>
        </div>

        {/*  RIGHT COLUMN: OPERATIONAL OVERVIEW  */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 shadow-sm border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Business Hours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TimeCard day="Mon - Fri" open={settings?.openingTime} close={settings?.closingTime} />
              <TimeCard day="Saturday" open={settings?.openingTime} close={settings?.closingTime} />
              <TimeCard day="Sunday" open="Closed" isClosed />
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
                 <Clock className="text-slate-300" size={32} />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm border-slate-100">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Platform Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
              <Stat label="Total Orders" value="---" color="text-indigo-600" />
              <Stat label="Menu Items" value="---" color="text-violet-600" />
              <Stat label="Staff Active" value="---" color="text-emerald-600" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* HELPER SUB-COMPONENTS */

const InfoItem = ({ icon: Icon, label, value, isMultiLine }) => (
  <li className="flex gap-3">
    <div className="p-2 bg-white rounded-lg shadow-sm h-fit border border-slate-100">
      <Icon size={16} className="text-indigo-500" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-sm font-bold text-slate-700 ${isMultiLine ? 'leading-relaxed' : ''}`}>
        {value || 'Not provided'}
      </p>
    </div>
  </li>
);

const TimeCard = ({ day, open, close, isClosed }) => (
  <div className={`p-4 rounded-2xl border transition-all ${isClosed ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 shadow-sm'}`}>
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{day}</p>
    <p className={`text-sm font-black ${isClosed ? 'text-rose-500' : 'text-slate-700'}`}>
      {isClosed ? 'CLOSED' : `${open || '09:00'} - ${close || '22:00'}`}
    </p>
  </div>
);

const Stat = ({ label, value, color }) => (
  <div className="text-center md:text-left bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

export default RestaurantProfile;