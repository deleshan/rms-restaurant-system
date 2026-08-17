import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';
import LoadingSpinner from './LoadingSpinner'; 

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md', 
  loading = false,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className = '',
  overlayClassName = '',
}) => {
  const modalRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Handle Escape Key
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, closeOnEsc]);

  // Trap Focus for Accessibility
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements?.length) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    const timer = setTimeout(() => first.focus(), 100);

    const trapFocus = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      clearTimeout(timer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full h-[95vh] rounded-none',
  };

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto',
        overlayClassName
      )}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      {/* Backdrop: Darker in light mode, deeper blur in dark mode */}
      <div
        className={cn(
          "fixed inset-0 transition-opacity duration-300",
          isDark ? "bg-black/80 backdrop-blur-md" : "bg-slate-900/40 backdrop-blur-sm"
        )}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full transform transition-all duration-300 scale-100 opacity-100',
          'rounded-[2.5rem] shadow-2xl overflow-hidden border',
          'backdrop-blur-2xl', 
          isDark 
            ? 'bg-slate-900/80 border-white/10 shadow-black/60' 
            : 'bg-white/90 border-white shadow-slate-200/50',
          sizeClasses[size] || sizeClasses.md,
          'max-h-[90vh] flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()} 
      >
        {/* Header */}
        {(title || onClose) && (
          <div className={cn(
            "px-8 pt-8 pb-4 flex items-start justify-between border-b transition-colors",
            isDark ? "border-white/5" : "border-slate-100"
          )}>
            <div className="space-y-1">
              {title && (
                <h2 className={cn(
                  "text-2xl font-black tracking-tight",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={cn(
                  "text-sm font-medium",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  {description}
                </p>
              )}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-2xl transition-all duration-200 active:scale-90",
                  isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                )}
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="Fetching details..." />
            </div>
          ) : (
            <div className={isDark ? "text-slate-300" : "text-slate-700"}>
              {children}
            </div>
          )}
        </div>

        {/* Footer */}
        {footer && (
          <div className={cn(
            "px-8 py-6 border-t flex justify-end gap-3 transition-colors",
            isDark ? "border-white/5 bg-white/5" : "border-slate-100 bg-slate-50/50"
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;