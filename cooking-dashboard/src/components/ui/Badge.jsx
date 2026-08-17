import React from 'react';

/**
 * Badge Component for Status and Priority labels
 * @param {string} variant - 'default', 'success', 'warning', 'danger', 'info', 'outline'
 * @param {boolean} pulse - If true, adds a glowing/pulsing animation (for urgent items)
 */
const Badge = ({ 
  children, 
  variant = 'default', 
  pulse = false, 
  className = '',
  icon: Icon 
}) => {
  
  const baseStyles = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all";

  const variants = {
    default: "bg-slate-700 text-slate-300 border-slate-600",
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    priority: "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-900/40",
    outline: "bg-transparent text-slate-400 border-slate-700"
  };

  const pulseStyles = pulse ? "animate-pulse ring-2 ring-offset-2 ring-offset-slate-900 ring-rose-500/50" : "";

  return (
    <span className={`${baseStyles} ${variants[variant]} ${pulseStyles} ${className}`}>
      {Icon && <Icon size={12} className="shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;