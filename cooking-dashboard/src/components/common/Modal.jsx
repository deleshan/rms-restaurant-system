import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Modal Component using React Portals
 * @param {boolean} isOpen - Controls visibility
 * @param {function} onClose - Function to close the modal
 * @param {string} title - Header text
 * @param {ReactNode} children - Body content
 * @param {ReactNode} footer - Optional action buttons
 */
const Modal = ({ isOpen, onClose, title, children, footer }) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle "Escape" key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  // Render to a portal div (make sure <div id="modal-root"></div> exists in your index.html)
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl transform transition-all flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 text-slate-300">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 bg-slate-900/30">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;