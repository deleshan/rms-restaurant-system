import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ChefHat, 
  ClipboardList, 
  History, 
  Package, 
  Settings, 
  Wifi, 
  WifiOff,
  Bell
} from 'lucide-react';
import { selectAllNotifications, selectUnreadCount } from '@/features/notifications/notificationSelectors';
import { markNotificationRead, markAllNotificationsRead } from '@/features/notifications/notificationThunks';

const KitchenNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markNotificationRead(notification._id));
    }
    setShowNotifications(false);
    if (notification.relatedType === 'Order') {
      navigate('/live-orders');
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

  const navItems = [
    { path: '/live-orders', label: 'Live Orders', icon: ClipboardList },
    { path: '/history', label: 'History', icon: History },
    { path: '/inventory', label: '86-List', icon: Package },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Left Section: Brand/Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-900/20">
          <ChefHat className="text-white w-6 h-6" />
        </div>
        <div className="hidden md:block">
          <h1 className="text-white font-black text-lg leading-tight uppercase tracking-tighter">
            Chef<span className="text-orange-500">Node</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Kitchen Display System
          </p>
        </div>
      </div>

      {/* Middle Section: Navigation Links */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${isActive 
                ? 'bg-orange-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'}
            `}
          >
            <item.icon size={18} />
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Right Section: Notifications, Status & Clock */}
      <div className="flex items-center gap-4">

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 bg-slate-800 rounded-lg border border-slate-700 hover:border-orange-600/50 transition-colors"
          >
            <Bell size={16} className="text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full ring-2 ring-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <p className="text-xs font-black uppercase tracking-widest text-white">
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-500 uppercase tracking-widest">
                  No notifications yet
                </p>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-3 py-3 rounded-xl transition-colors hover:bg-slate-800 ${!n.isRead ? 'bg-orange-600/10' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">
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

        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
          {isOnline ? (
            <>
              <Wifi size={14} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 hidden lg:inline">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-rose-500 animate-pulse" />
              <span className="text-[10px] font-bold text-rose-500 hidden lg:inline">OFFLINE</span>
            </>
          )}
        </div>

        {/* Real-time Clock */}
        <div className="text-right hidden xs:block">
          <div className="text-white font-mono font-bold text-lg leading-none">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase">
            {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default KitchenNavbar;