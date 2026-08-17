import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';

// State Management
let toastId = 0;
let toastQueue = [];
const listeners = new Set();

const updateListeners = () => {
  listeners.forEach((callback) => callback([...toastQueue]));
};

const addToast = (type, message, options = {}) => {
  const id = toastId++;
  const newToast = { id, type, message, duration: 5000, ...options };
  toastQueue.push(newToast);
  updateListeners();
  return id;
};

const removeToast = (id) => {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  updateListeners();
};

export const toast = {
  success: (msg, opts) => addToast('success', msg, opts),
  error: (msg, opts) => addToast('error', msg, opts),
  warning: (msg, opts) => addToast('warning', msg, opts),
  info: (msg, opts) => addToast('info', msg, opts),
};

// Components

const ToastItem = ({ toast }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { type, message, duration, onClose, id } = toast;
  const [progress, setProgress] = useState(100);

  const variants = {
    success: {
      icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
      bar: "bg-emerald-500",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/10"
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-rose-500" />,
      bar: "bg-rose-500",
      border: "border-rose-500/20",
      glow: "shadow-rose-500/10"
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      bar: "bg-amber-500",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/10"
    },
    info: {
      icon: <Info className="h-5 w-5 text-brand" />,
      bar: "bg-brand",
      border: "border-brand/20",
      glow: "shadow-brand/10"
    },
  };

  const style = variants[type] || variants.info;

  useEffect(() => {
    if (duration === Infinity) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        removeToast(id);
        onClose?.();
      }
    }, 16); 

    return () => clearInterval(interval);
  }, [duration, id, onClose]);

  return (
    <div
      className={cn(
        'group relative overflow-hidden flex items-start gap-4 p-5 rounded-[1.5rem] border shadow-2xl pointer-events-auto transition-all duration-500',
        'backdrop-blur-2xl animate-in slide-in-from-right-10 fade-in',
        isDark 
          ? 'bg-slate-900/80 border-white/10 text-white' 
          : 'bg-white/90 border-slate-200 text-slate-800',
        style.glow
      )}
      role="alert"
    >
      {/* Dynamic Progress Bar Background */}
      <div 
        className={cn("absolute bottom-0 left-0 h-[3px] transition-all ease-linear opacity-60", style.bar)}
        style={{ width: `${progress}%` }}
      />

      <div className={cn(
        "p-2 rounded-xl transition-colors",
        isDark ? "bg-white/5" : "bg-slate-100"
      )}>
        {style.icon}
      </div>

      <div className="flex-1 pt-1.5">
        <p className="text-sm font-bold tracking-tight">{message}</p>
      </div>

      <button
        onClick={() => {
          removeToast(id);
          onClose?.();
        }}
        className={cn(
          "p-1.5 rounded-lg transition-all duration-200 active:scale-90",
          isDark ? "hover:bg-white/10 text-slate-500" : "hover:bg-slate-200 text-slate-400"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const ToastProvider = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (updated) => setToasts(updated);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body
  );
};

export default toast;