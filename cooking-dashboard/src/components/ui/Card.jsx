import React from 'react';

/**
 * A modular Card system for the Kitchen Dashboard.
 * Includes sub-components: CardHeader, CardContent, and CardFooter.
 */

export const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = "" }) => (
  <div className={`px-5 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = "" }) => (
  <div className={`p-5 flex-1 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = "" }) => (
  <div className={`px-5 py-4 border-t border-slate-700 bg-slate-900/30 mt-auto ${className}`}>
    {children}
  </div>
);