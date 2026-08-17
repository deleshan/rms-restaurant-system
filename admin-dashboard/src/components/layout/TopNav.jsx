import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const TopNav = ({ menuItems = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* DYNAMIC STICKY TOP NAVIGATION */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-slate-900/90 backdrop-blur-2xl rounded-full p-2 flex justify-around items-center shadow-2xl z-[100] border border-white/10">
        {menuItems.map((item) => (
          <button 
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-full transition-all flex-1 ${
              isActive(item.path) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="pt-24 pb-12">
        <Outlet /> 
      </main>
    </div>
  );
};

export default TopNav;