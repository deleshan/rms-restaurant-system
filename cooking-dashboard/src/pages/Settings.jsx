import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Type, 
  Bell, 
  LogOut,
  Terminal,
  RefreshCw,
  Layout
} from 'lucide-react';

// Auth Actions & Selectors
import { logoutStaff, setStation } from '@/features/auth/authSlice';
import { selectCurrentStaff, selectAssignedStation } from '@/features/auth/authSelectors';

// Settings Actions & Selectors
import { 
  updateFontSize, 
  toggleAudio, 
  toggleCompactMode 
} from '@/features/settings/settingsSlice';
import { 
  selectFontSize, 
  selectAudioAlertsEnabled, 
  selectCompactMode,
} from '@/features/settings/settingsSelectors';

import Button from '@/components/common/Button';

const Settings = () => {
  const dispatch = useDispatch();

  const staff = useSelector(selectCurrentStaff);
  const station = useSelector(selectAssignedStation);

  const fontSize = useSelector(selectFontSize);
  const audioEnabled = useSelector(selectAudioAlertsEnabled);
  const isCompact = useSelector(selectCompactMode);
  


  const handleLogout = () => {
    if (window.confirm('Are you sure you want to end your shift?')) {
      dispatch(logoutStaff());
    }
  };

  const stations = ['Full Kitchen', 'Grill', 'Salad', 'Fry', 'Dessert'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-slate-800 rounded-2xl">
          <SettingsIcon className="text-orange-500 w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">
            Terminal<span className="text-orange-500">Settings</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
            Logged in as: <span className="text-slate-300">{staff?.name || 'Staff'}</span> — {staff?.role || 'User'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kitchen Station  */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white mb-2">
            <Terminal size={20} className="text-blue-500" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Active Station</h2>
          </div>
          <p className="text-slate-500 text-xs">Filter this terminal's order feed by kitchen section.</p>
          <div className="grid grid-cols-2 gap-2">
            {stations.map((s) => (
              <button
                key={s}
                onClick={() => dispatch(setStation(s))}
                className={`py-3 px-4 rounded-xl font-black text-[10px] uppercase transition-all border-2 ${
                  station === s 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                    : 'border-slate-800 bg-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Audio & Alerts */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white mb-2">
            <Bell size={20} className="text-orange-500" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Alerts</h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              {audioEnabled ? <Volume2 className="text-emerald-500" /> : <VolumeX className="text-slate-500" />}
              <span className="font-bold text-sm text-slate-200">New Order Chime</span>
            </div>
            <button 
              onClick={() => dispatch(toggleAudio())}
              className={`w-12 h-6 rounded-full transition-colors relative ${audioEnabled ? 'bg-emerald-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${audioEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase italic opacity-50">
            * Urgent alerts will still flash visually.
          </p>
        </section>

        {/* Readability */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white mb-2">
            <Type size={20} className="text-purple-500" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Typography</h2>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Ticket Text Size</label>
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => dispatch(updateFontSize(size))}
                  className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${
                    fontSize === size ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Display Layout */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-white mb-2">
            <Layout size={20} className="text-emerald-500" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Interface</h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-slate-200  uppercase tracking-widest">Compact Mode</span>
            </div>
            <button 
              onClick={() => dispatch(toggleCompactMode())}
              className={`w-12 h-6 rounded-full transition-colors relative ${isCompact ? 'bg-emerald-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isCompact ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </section>
      </div>

      {/* Logout Footer */}
      <div className="pt-8 border-t border-slate-800 flex flex-col items-center">
        <Button 
          variant="danger" 
          size="xl" 
          className="w-full max-w-sm rounded-2xl py-6 text-lg font-black italic tracking-tighter"
          icon={LogOut}
          onClick={handleLogout}
        >
          END SHIFT & LOGOUT
        </Button>
        <div className="mt-6 text-center space-y-1">
          <p className="text-slate-500 text-[10px] font-mono uppercase">Terminal ID: KDS-NODE-04</p>
          <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.3em]">Version 2.4.0-STABLE</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;