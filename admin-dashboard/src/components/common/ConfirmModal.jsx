import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from './Button';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message, 
  confirmText = "Confirm",
  variant = "danger" 
}) => {
  if (!isOpen) return null;

  const variants = {
    danger: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
    warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
    primary: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={20} className="text-slate-400" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className={cn(
            "p-4 rounded-3xl",
            variant === 'warning' ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-500"
          )}>
            <AlertTriangle size={32} />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 w-full pt-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-2xl py-6" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <button
              className={cn(
                "flex-1 py-4 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95",
                variants[variant]
              )}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;