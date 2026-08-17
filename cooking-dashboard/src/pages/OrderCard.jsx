import React from 'react';
import { 
  Clock, 
  Play, 
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import Badge from '@/components/ui/Badge'; 
import Button from '@/components/common/Button';

const OrderCard = ({ order, onUpdateStatus, viewMode = 'grid' }) => {
 
  const { formatted, isUrgent } = useTimer(order.createdAt);

  // Dynamic styling based on order status and kitchen urgency
  const getStatusStyles = () => {
    if (order.status === 'Ready') {
      return {
        border: 'border-t-emerald-500',
        bg: 'bg-emerald-500/5',
        accent: 'text-emerald-500',
        badge: 'bg-emerald-500/20 text-emerald-400'
      };
    }
    if (isUrgent) {
      return {
        border: 'border-t-rose-600',
        bg: 'bg-rose-950/20',
        accent: 'text-rose-500',
        badge: 'bg-rose-600 text-white animate-pulse'
      };
    }
    return order.status === 'Preparing' 
      ? { border: 'border-t-blue-500', bg: 'bg-slate-900', accent: 'text-blue-500', badge: 'bg-blue-500/20 text-blue-400' }
      : { border: 'border-t-orange-500', bg: 'bg-slate-900', accent: 'text-orange-500', badge: 'bg-orange-500/20 text-orange-400' };
  };

  const styles = getStatusStyles();

  return (
    <div className={`flex flex-col rounded-3xl border-t-4 ${styles.border} ${styles.bg} border-x border-b border-slate-800 shadow-2xl transition-all duration-300 overflow-hidden`}>
      
      {/* HEADER: Table Info & Timer */}
      <div className="p-5 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-white tracking-tighter">
              T-{order.tableId || '??'}
            </h2>
            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${styles.badge}`}>
              {order.status}
            </span>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            #{order._id.slice(-6).toUpperCase()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className={`flex flex-col items-end p-2 rounded-2xl ${isUrgent && order.status !== 'Ready' ? 'bg-rose-600' : 'bg-slate-800'}`}>
          <div className="flex items-center gap-1.5 text-white">
            <Clock size={16} className={isUrgent ? 'animate-spin-slow' : ''} />
            <span className="font-mono text-lg font-black">{formatted}</span>
          </div>
        </div>
      </div>

      {/* CONTENT: Items List */}
      <div className="px-5 pb-5 flex-1">
        <div className="space-y-4">
          <ul className="divide-y divide-slate-800/50">
            {order.items.map((item, idx) => (
              <li key={idx} className="py-3 first:pt-0 group">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 text-orange-500 font-black text-xl border border-slate-700">
                    {item.qty}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-100 font-black text-lg leading-tight uppercase italic group-hover:text-orange-400 transition-colors">
                      {item.name}
                    </p>
                    
                    {/* HIGH CONTRAST CUSTOMIZATIONS */}
                    {item.customizations?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.customizations.map((mod, i) => (
                          <span key={i} className="bg-rose-500/10 text-rose-500 text-[11px] font-black px-2 py-0.5 rounded-md border border-rose-500/20 uppercase">
                            NO {mod}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Special Requests (e.g. Allergy Alerts) */}
          {order.specialRequest && (
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-xl">
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Kitchen Note</span>
              </div>
              <p className="text-sm text-amber-200/90 font-bold italic leading-relaxed">
                "{order.specialRequest}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: Actions */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-800">
        {order.status === 'Pending' && (
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            onClick={() => onUpdateStatus(order._id, 'Preparing')}
          >
            <Play size={20} fill="currentColor" />
            START COOKING
          </Button>
        )}

        {order.status === 'Preparing' && (
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95"
            onClick={() => onUpdateStatus(order._id, 'Ready')}
          >
            <CheckCircle2 size={20} />
            MARK AS READY
          </Button>
        )}

        {order.status === 'Ready' && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-500 font-black uppercase text-sm tracking-widest bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={18} />
              Waitstaff Notified
            </div>
            <button 
              onClick={() => onUpdateStatus(order._id, 'Completed')}
              className="w-full text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
            >
              Archive Ticket <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;