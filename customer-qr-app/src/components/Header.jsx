import React from 'react';
import { useSelector } from 'react-redux';
import { selectTableId } from '../features/auth/authSelectors';

const Header = () => {
  const tableId = useSelector(selectTableId) || '00';

  return (
    <header className="sticky top-0 z-50 bg-white/40 backdrop-blur-md border-b border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Left Section: Logo & Info */}
        <div className="flex items-center space-x-3">
          <div className="bg-brand rounded-2xl p-2.5 shadow-lg shadow-indigo-100 border border-indigo-700/50">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.582.477 5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter">
              Neo<span className="text-brand">Demeter</span>
            </h1>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                Serving Now
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Compact Table Badge (Internal Glassmorphism) */}
        <div className="flex items-center bg-white/30 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white shadow-inner shadow-white">
          <div className="text-center">
            <p className="text-[9px] text-slate-400 uppercase font-black leading-none tracking-widest">
              Table
            </p>
            <p className="text-xl font-black text-brand leading-none mt-1 italic tracking-tight">
              {tableId}
            </p>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;