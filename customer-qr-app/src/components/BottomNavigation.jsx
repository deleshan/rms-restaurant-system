import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNavigation = () => {
  // Common styles for the NavLinks
  const navLinkClasses = ({ isActive }) =>
    `flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 relative ${
      isActive ? 'text-brand scale-110' : 'text-slate-400 hover:text-slate-600'
    }`;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex justify-around p-2 pointer-events-auto">
        
        {/* Menu Link */}
        <NavLink to="/menu" className={navLinkClasses}>
          {({ isActive }) => (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Menu</span>
              {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-brand rounded-full" />}
            </>
          )}
        </NavLink>

        {/* Cart Link */}
        <NavLink to="/cart" className={navLinkClasses}>
          {({ isActive }) => (
            <>
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {/* Red dot badge */}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Cart</span>
              {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-brand rounded-full" />}
            </>
          )}
        </NavLink>

        {/* Orders Link */}
        <NavLink to="/orders" className={navLinkClasses}>
          {({ isActive }) => (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Orders</span>
              {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-brand rounded-full" />}
            </>
          )}
        </NavLink>

        {/* Profile Link */}
        <NavLink to="/profile" className={navLinkClasses}>
          {({ isActive }) => (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Profile</span>
              {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-brand rounded-full" />}
            </>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNavigation;