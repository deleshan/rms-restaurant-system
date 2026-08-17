import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User,
  Settings,
  Cpu
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme'; 
import { logout } from '@/features/auth/authThunks';
import { globalSearch } from '@/features/dashboard/dashboardThunks';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/features/notifications/notificationThunks';
import { selectAllNotifications, selectUnreadCount } from '@/features/notifications/notificationSelectors';

const TopBar = ({ toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme(); 
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const menuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ orders: [], menuItems: [], customers: [] });
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  const isDark = theme === 'dark';
  const { user } = useSelector((state) => state.auth);
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutsideNotif = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideNotif);
    return () => document.removeEventListener('mousedown', handleClickOutsideNotif);
  }, []);

  const getPageTitle = () => {
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab');

    if (activeTab) {
      return activeTab
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 0) return 'System Overview';
    return path[path.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'AD';
  };

  const handleSearchChange = (value) => {
  setSearchQuery(value);
  if (debounceRef.current) clearTimeout(debounceRef.current);

  if (value.trim().length < 2) {
    setSearchResults({ orders: [], menuItems: [], customers: [] });
    setShowResults(false);
    return;
  }

  debounceRef.current = setTimeout(async () => {
    const result = await dispatch(globalSearch(value));
    if (globalSearch.fulfilled.match(result)) {
      setSearchResults(result.payload);
      setShowResults(true);
    }
  }, 350);
};

const handleResultClick = (type, item) => {
  setShowResults(false);
  setSearchQuery('');
  if (type === 'order') navigate(`/orders/${item._id}`);
  if (type === 'menuItem') navigate(`/menu/${item._id}`);
  if (type === 'customer') navigate(`/customers/${item._id}`);
};

const handleNotificationClick = (notification) => {
  if (!notification.isRead) {
    dispatch(markNotificationRead(notification._id));
  }
  setShowNotifications(false);
  if (notification.relatedType === 'Order' && notification.relatedId) {
    navigate(`/orders/${notification.relatedId}`);
  }
};

const handleMarkAllRead = (e) => {
  e.stopPropagation();
  dispatch(markAllNotificationsRead());
};

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

  return (
    <header className="px-6 py-4 sticky top-0 z-50 overflow-visible">
      <div 
        className={cn(
          "max-w-full mx-auto px-6 h-16 flex items-center justify-between transition-all duration-500",
          "backdrop-blur-2xl rounded-[2rem] border relative",
          isDark 
            ? "bg-slate-900/60 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
            : "bg-white/60 border-white shadow-[0_8px_32px_rgba(148,163,184,0.15)]"
        )}
      >
        {/* Left Section: Navigation & Title */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-2.5 rounded-2xl transition-all duration-300 border group",
              isDark 
                ? "bg-white/5 border-white/5 text-slate-400 hover:text-brand hover:border-brand/30" 
                : "bg-slate-100 border-slate-200 text-slate-500 hover:text-brand hover:border-brand/30"
            )}
          >
            <Menu className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
          </button>

          <div className="hidden lg:block">
            <h1 className={cn(
              "text-xs font-black tracking-[0.2em] uppercase transition-colors duration-300",
              isDark ? "text-slate-400" : "text-slate-500"
            )}>
              Dashboard /
            </h1>
            <p className={cn(
              "text-lg font-black tracking-tighter transition-colors duration-300",
              isDark ? "text-white" : "text-slate-900"
            )}>
              {getPageTitle()}
            </p>
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-3">
          
          {/* AI System Status Indicator */}
          <div className={cn(
            "hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest mr-4 transition-all duration-300",
            isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600"
          )}>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            AI Core Active
          </div>

          {/* Search Bar - Expandable */}
          <div className="relative group">
            <Search className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors z-10",
              isSearchFocused ? "text-brand" : "text-slate-400"
            )} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { setIsSearchFocused(true); if (searchResults && searchQuery.length >= 2) setShowResults(true); }}
              onBlur={() => { setIsSearchFocused(false); setTimeout(() => setShowResults(false), 150); }}
              placeholder="Search orders, menu, customers..."
              className={cn(
                "transition-all duration-500 ease-in-out py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider border",
                "placeholder:text-slate-500",
                isSearchFocused 
                  ? "w-80 pl-11 pr-4 ring-4 ring-brand/5 border-brand bg-white/5" 
                  : "w-44 pl-11 pr-4 border-transparent bg-transparent hover:bg-white/5",
                isDark ? "text-white" : "text-slate-900"
              )}
            />

            {showResults && (
              <div className={cn(
                "absolute top-full left-0 mt-2 w-96 max-h-96 overflow-y-auto rounded-2xl border shadow-2xl z-50",
                isDark ? "bg-slate-900/95 border-white/10" : "bg-white border-slate-200"
              )}>
                {searchResults.orders?.length === 0 && searchResults.menuItems?.length === 0 && searchResults.customers?.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 uppercase tracking-widest">No results</p>
                ) : (
                  <>
                    {searchResults.orders?.length > 0 && (
                      <div className="p-2">
                        <p className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Orders</p>
                        {searchResults.orders.map((o) => (
                          <button key={o._id} onClick={() => handleResultClick('order', o)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand/10 text-xs">
                            Table {o.tableId} — Rs. {o.totalPrice} · {o.status}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.menuItems?.length > 0 && (
                      <div className="p-2 border-t border-slate-100 dark:border-white/5">
                        <p className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Menu Items</p>
                        {searchResults.menuItems.map((m) => (
                          <button key={m._id} onClick={() => handleResultClick('menuItem', m)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand/10 text-xs">
                            {m.name} — {m.category}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.customers?.length > 0 && (
                      <div className="p-2 border-t border-slate-100 dark:border-white/5">
                        <p className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Customers</p>
                        {searchResults.customers.map((c) => (
                          <button key={c._id} onClick={() => handleResultClick('customer', c)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand/10 text-xs">
                            {c.name} — {c.phone}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle with Tooltip */}
          <div className="relative group/tooltip">
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2.5 rounded-2xl border transition-all duration-300",
                isDark 
                  ? "bg-slate-800/40 border-white/10 text-amber-400 hover:bg-slate-700 shadow-lg shadow-amber-900/10" 
                  : "bg-white border-slate-200 text-slate-600 hover:text-brand shadow-sm"
              )}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Floating Tooltip Above Page */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </div>

          {/* Notifications with Working Dropdown */}
          <div className="relative overflow-visible z-50" ref={notifRef}>
            <div className="relative group/tooltip">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative p-2.5 rounded-2xl border transition-all duration-300",
                  isDark 
                    ? "bg-slate-800/40 border-white/10 text-slate-400 hover:text-brand" 
                    : "bg-white border-slate-200 text-slate-600 hover:text-brand"
                )}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-white/10">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-50 whitespace-nowrap shadow-xl">
                Notifications
              </span>
            </div>

            {showNotifications && (
              <div className={cn(
                "absolute right-0 mt-4 w-80 max-h-96 overflow-y-auto backdrop-blur-3xl rounded-[1.5rem] shadow-2xl border p-2 z-50 animate-in fade-in zoom-in slide-in-from-top-4 duration-300",
                isDark ? "bg-slate-900/90 border-white/10" : "bg-white/95 border-slate-200"
              )}>
                <div className="flex items-center justify-between px-4 py-3">
                  <p className={cn("text-xs font-black uppercase tracking-widest", isDark ? "text-white" : "text-slate-900")}>
                    Notifications
                  </p>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[9px] font-black uppercase tracking-widest text-brand hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-400 uppercase tracking-widest">
                    No notifications yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-colors",
                          !n.isRead && (isDark ? "bg-brand/10" : "bg-brand/5"),
                          isDark ? "hover:bg-white/5" : "hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-slate-900")}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
                              {timeAgo(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className={cn("h-8 w-px mx-2", isDark ? "bg-white/5" : "bg-slate-200")} />

          {/* User Profile */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                "flex items-center gap-3 p-1 rounded-2xl transition-all duration-300 border border-transparent",
                isDark ? "hover:bg-white/5" : "hover:bg-slate-100"
              )}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-brand to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-brand/20 uppercase tracking-tighter">
                {getInitials(user?.name)}
              </div>
              <div className="hidden sm:block text-left">
                <p className={cn("text-xs font-black tracking-tight uppercase leading-none", isDark ? "text-white" : "text-slate-900")}>
                  {user?.name?.split(' ')[0] || 'User'}
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  {user?.role || 'Access Level 1'}
                </p>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform duration-300", showUserMenu && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className={cn(
                "absolute right-0 mt-4 w-72 backdrop-blur-3xl rounded-[2rem] shadow-2xl border p-3 z-50 animate-in fade-in zoom-in slide-in-from-top-4 duration-300",
                isDark ? "bg-slate-900/90 border-white/10" : "bg-white/95 border-slate-200"
              )}>
                <div className="px-5 py-4 mb-2">
                  <p className={cn("text-sm font-black uppercase tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                    System Operator
                  </p>
                  <p className="text-[10px] font-bold text-brand uppercase tracking-[0.2em] mt-1">
                    {user?.username || 'authenticated_staff'}
                  </p>
                </div>

                <div className="space-y-1">
                  <MenuButton icon={<User size={16} />} label="Operational Profile" onClick={() => navigate('/profile')} isDark={isDark} />
                  <MenuButton icon={<Settings size={16} />} label="Neural Settings" onClick={() => navigate('/settings')} isDark={isDark} />
                </div>

                <div className={cn("mt-3 pt-3 border-t", isDark ? "border-white/5" : "border-slate-100")}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-rose-500 hover:bg-rose-500/10 transition-all duration-300"
                  >
                    <LogOut size={14} /> LogOut
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Helper Sub-component for Dropdown
const MenuButton = ({ icon, label, onClick, isDark }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
      isDark ? "text-slate-400 hover:bg-white/5 hover:text-brand" : "text-slate-600 hover:bg-brand/5 hover:text-brand"
    )}
  >
    {icon} {label}
  </button>
);

export default TopBar;