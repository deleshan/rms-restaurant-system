import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Receipt,
  Users,
  Percent,
  MessageSquare,
  Package,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Table2,
  UserCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';


const NavItem = ({ item, isCollapsed, isDark }) => {
  const [tooltip, setTooltip] = useState({ visible: false, y: 0 });
  const liRef = useRef(null);

  const showTooltip = () => {
    if (!isCollapsed) return;
    const rect = liRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({ visible: true, y: rect.top + rect.height / 2 });
    }
  };

  const hideTooltip = () => setTooltip({ visible: false, y: 0 });

  return (
    <li
      ref={liRef}
      className="relative"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-x-4 px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] rounded-[1.5rem] transition-all duration-500 relative overflow-hidden',
            isCollapsed && 'justify-center px-0',
            isActive
              ? [
                  isDark ? 'bg-brand/10 text-white' : 'bg-brand/5 text-brand',
                  'shadow-[0_0_20px_rgba(99,102,241,0.05)] border border-brand/10',
                ]
              : [
                  'text-slate-500 hover:bg-slate-400/5',
                  isDark ? 'hover:text-slate-200' : 'hover:text-slate-900',
                ]
          )
        }
      >
        {({ isActive }) => (
          <>
            <item.icon
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-all duration-500',
                isActive
                  ? 'text-brand scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                  : 'text-slate-400'
              )}
            />
            {!isCollapsed && (
              <span className="transition-all duration-500 text-[12px]">
                {item.name}
              </span>
            )}
            {isActive && (
              <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-brand shadow-[0_0_15px_rgba(99,102,241,1)]" />
            )}
          </>
        )}
      </NavLink>

      {/* Tooltip */}
      {isCollapsed && tooltip.visible && (
        <div
          className={cn(
            'fixed left-[6.5rem] z-[9999] -translate-y-1/2 pointer-events-none',
            'flex items-center gap-2',
            'animate-in fade-in slide-in-from-left-2 duration-200'
          )}
          style={{ top: tooltip.y }}
        >
          {/* Arrow */}
          <div
            className={cn(
              'w-2 h-2 rotate-45 shrink-0',
              isDark
                ? 'bg-slate-800 border-l border-t border-white/10'
                : 'bg-white border-l border-t border-slate-200'
            )}
          />
          {/* Label */}
          <span
            className={cn(
              'px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-2xl backdrop-blur-md',
              isDark
                ? 'bg-slate-800/95 text-white border border-white/10'
                : 'bg-black text-white border border-black'
            )}
          >
            {item.name}
          </span>
        </div>
      )}
    </li>
  );
};

/* Sidebar */
const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navigationGroups = [
    {
      title: 'Operations',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Orders', href: '/orders', icon: ShoppingCart },
        { name: 'Finance', href: '/finance', icon: Receipt },
      ],
    },
    {
      title: 'Management',
      items: [
        { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
        { name: 'Floor Map', href: '/tables', icon: Table2 },
        { name: 'Inventory', href: '/inventory', icon: Package },
      ],
    },
    {
      title: 'Marketing',
      items: [
        { name: 'Customers', href: '/customers', icon: Users },
        { name: 'Promotions', href: '/promotions', icon: Percent },
        { name: 'Reviews', href: '/reviews', icon: MessageSquare },
      ],
    },
    {
      title: 'System',
      items: [
        { name: 'Profile', href: '/profile', icon: UserCircle },
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 p-5 transition-all duration-700 ease-custom-ease z-40',
        isCollapsed ? 'w-28' : 'w-80'
      )}
    >
      <div
        className={cn(
          'flex flex-col h-full transition-all duration-700 relative',
          'rounded-[2.8rem] border backdrop-blur-2xl',
          'bg-teal-50 border-white/60 shadow-xl shadow-slate-200/40',
          'dark:bg-slate-900/40 dark:border-white/10 dark:shadow-2xl dark:shadow-black/50'
        )}
      >
        {/* Glow Element */}
        {isDark && (
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand/10 blur-[80px] rounded-full pointer-events-none" />
        )}

        {/* Logo Section */}
        <div
          className={cn(
            'h-28 flex items-center shrink-0 relative transition-all duration-500',
            isCollapsed ? 'justify-center px-0' : 'justify-between px-8'
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="relative group/logo">
                <div className="absolute inset-0 bg-brand/40 blur-lg rounded-2xl group-hover/logo:bg-brand/60 transition-all duration-500" />
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-brand to-violet-600 flex items-center justify-center shadow-2xl border border-white/20">
                  <Sparkles className="text-white w-6 h-6 animate-pulse" strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-[13px] font-black tracking-tighter uppercase leading-tight',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}
                >
                  Admin RMS
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1 h-1 rounded-full bg-brand animate-ping" />
                  <span className="text-[9px] font-black text-brand uppercase tracking-[0.25em]">
                    AI Active
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'p-3 rounded-2xl transition-all duration-500 border group/toggle relative',
              isDark
                ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-brand/20 hover:border-brand/40'
                : 'bg-white border-slate-200 text-slate-500 hover:text-brand hover:border-brand/20 shadow-sm',
              isCollapsed ? 'scale-110' : ''
            )}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}

            {/* Toggle Tooltip */}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/toggle:opacity-100 pointer-events-none transition-all duration-300 translate-x-2 group-hover/toggle:translate-x-0 z-50 whitespace-nowrap shadow-xl">
                Expand Sidebar
              </span>
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto no-scrollbar space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              {!isCollapsed && (
                <h3
                  className={cn(
                    'px-5 text-[12px] font-black uppercase tracking-[0.3em] transition-opacity duration-500',
                    isDark ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  {group.title}
                </h3>
              )}

              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    isCollapsed={isCollapsed}
                    isDark={isDark}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Panel */}
        <div
          className={cn(
            'p-5 border-t transition-colors duration-700',
            isDark ? 'border-white/5' : 'border-slate-100'
          )}
        >
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-x-4 px-5 py-4 text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl transition-all duration-500',
              'border border-transparent group/logout relative',
              isDark
                ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/10'
                : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100',
              isCollapsed && 'justify-center px-0'
            )}
          >
            <LogOut
              size={18}
              className="group-hover/logout:-translate-x-1 transition-transform duration-500"
            />
            {!isCollapsed && <span>logout</span>}

            {/* Logout Tooltip */}
            {isCollapsed && (
              <span className="absolute left-full ml-4 px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-0 group-hover/logout:opacity-100 transition-all duration-300 -translate-x-4 group-hover/logout:translate-x-0 shadow-lg shadow-rose-500/20 z-[200] pointer-events-none">
                Logout
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-rose-500" />
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
