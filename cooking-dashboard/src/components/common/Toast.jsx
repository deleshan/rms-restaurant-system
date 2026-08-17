import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  BellRing,
  Loader2 
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Singleton Manager
let toastManager = null;

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = options.id || Date.now();
    const duration = options.duration || 5000;

    setToasts((prev) => [...prev, { id, message, type, ...options }]);

    if (duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    toastManager = { add: addToast, remove: removeToast };
  }, [addToast, removeToast]);

  return createPortal(
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-[380px] pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  );
};

// Individual Toast Item 
const ToastItem = ({ message, type, onClose, duration }) => {
  const configs = {
    success: {
      icon: <CheckCircle2 size={20} />,
      class: "border-emerald-500/50 bg-emerald-950/90 text-emerald-400",
      bar: "bg-emerald-500"
    },
    error: {
      icon: <AlertCircle size={20} />,
      class: "border-rose-500/50 bg-rose-950/90 text-rose-400",
      bar: "bg-rose-500"
    },
    warning: {
      icon: <AlertCircle size={20} />,
      class: "border-amber-500/50 bg-amber-950/90 text-amber-400",
      bar: "bg-amber-500"
    },
    info: {
      icon: <Info size={20} />,
      class: "border-blue-500/50 bg-blue-950/90 text-blue-400",
      bar: "bg-blue-500"
    },
    order: {
      icon: <BellRing size={20} className="animate-bounce" />,
      class: "border-orange-500/50 bg-slate-900 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]",
      bar: "bg-orange-500"
    }
  };

  const config = configs[type] || configs.info;

  return (
    <div className={cn(
      "pointer-events-auto relative overflow-hidden flex items-start gap-4 p-4 rounded-2xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-300",
      config.class
    )}>
      <div className="mt-0.5">{config.icon}</div>
      <div className="flex-1">
        <div className="text-sm font-black uppercase tracking-tight leading-tight">
          {message}
        </div>
      </div>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
      
      {/* Progress Bar */}
      {duration !== Infinity && (
        <div 
          className={cn("absolute bottom-0 left-0 h-1 opacity-30 animate-progress", config.bar)}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
};

// Public API 
export const toast = {
  success: (msg, opts) => toastManager?.add(msg, 'success', opts),
  error: (msg, opts) => toastManager?.add(msg, 'error', opts),
  info: (msg, opts) => toastManager?.add(msg, 'info', opts),
  warning: (msg, opts) => toastManager?.add(msg, 'warning', opts),
  order: (msg, opts) => toastManager?.add(msg, 'order', opts), // Specific for new orders
};

export default ToastContainer;