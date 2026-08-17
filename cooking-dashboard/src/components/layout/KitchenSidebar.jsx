import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  IceCream, 
  Coffee, 
  Beer, 
  Clock, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectStationCounts, selectUrgentCount, selectAvgPrepTime } from '@/features/orders/orderSelectors';
import { selectSettingsData } from '@/features/settings/settingsSelectors';


const KitchenSidebar = ({ activeStation, onStationSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const stationCounts = useSelector(selectStationCounts);
  const urgentCount = useSelector(selectUrgentCount);
  const avgPrepTime = useSelector(selectAvgPrepTime);
  const { restaurantName } = useSelector(selectSettingsData);

  // Mock stats - in a real app, these come from Redux selectors
  const stationConfig = [
    { name: 'Hot Station', icon: Flame, color: 'text-orange-500' },
    { name: 'Cold Station', icon: IceCream, color: 'text-blue-400' },
    { name: 'Bar / Drinks', icon: Beer, color: 'text-yellow-500' },
  ];

  return (
    <aside 
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col relative
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-orange-600 rounded-full p-1 text-white border-2 border-slate-900 z-10 hover:bg-orange-500 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Section: Station Filter (Quick View) */}
      <div className="p-4 flex-1">
        <h2 className={`text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-6 whitespace-nowrap
          ${isCollapsed ? 'text-center' : 'text-left'}
        `}>
          {isCollapsed ? 'STNS' : 'Station Filters'}
        </h2>

        <div className="space-y-2">
          {stationConfig.map((station) => (
            <button
              key={station.name}
              onClick={() => onStationSelect(station.name === activeStation ? 'All' : station.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors group
                ${isCollapsed ? 'justify-center' : ''}
                ${activeStation === station.name ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-slate-800'}
              `}
            >
              <station.icon className={`${station.color} shrink-0`} size={20} />
              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className={`font-medium text-sm ${activeStation === station.name ? 'text-orange-400' : 'text-slate-300 group-hover:text-white'}`}>
                    {station.name}
                  </span>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full group-hover:bg-slate-700">
                    {stationCounts[station.name] ?? 0}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        <hr className="my-6 border-slate-800" />

        {/* Section: Performance Insights */}
        {!isCollapsed && (
          <div className="space-y-6">
            <h2 className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
              Kitchen Performance
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <TrendingUp className="text-emerald-500" size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Avg Prep Time</p>
                  <p className="text-white font-mono font-bold">{avgPrepTime ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-rose-500/10 p-2 rounded-lg">
                  <AlertTriangle className="text-rose-500" size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Delayed Tickets</p>
                  <p className="text-white font-mono font-bold">{String(urgentCount).padStart(2, '0')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer: User/Shift Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-orange-600 flex items-center justify-center font-bold text-white shrink-0">
            <img/>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{restaurantName || 'Loading...'}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Head Chef</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default KitchenSidebar;