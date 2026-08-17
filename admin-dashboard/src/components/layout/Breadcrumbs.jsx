import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';

const routeLabels = {
  '/': 'Dashboard',
  '/orders': 'Orders',
  '/finance': 'Finance',
  '/menu': 'Menu Management',
  '/customers': 'Customers',
  '/promotions': 'Promotions',
  '/reviews': 'Reviews',
  '/inventory': 'Inventory',
  '/kitchen': 'Kitchen Display',
  '/settings': 'Settings',
};

const Breadcrumbs = ({ className = '' }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathnames = location.pathname.split('/').filter(x => x);

  // Build breadcrumb items
  const breadcrumbs = pathnames.map((value, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;

    // Get custom label or fallback to capitalized segment
    const label = routeLabels[to] || value.charAt(0).toUpperCase() + value.slice(1);

    return {
      label,
      to,
      isLast,
    };
  });

  // Insert home as first item
  const items = [
    { label: 'Home', to: '/', icon: <Home size={16} />, isLast: false },
    ...breadcrumbs,
  ];

  // Logic for mobile responsiveness (collapsing)
  const shouldCollapse = items.length > 3;
  const visibleItems = shouldCollapse
    ? [items[0], { label: '...', isLast: false }, ...items.slice(-1)]
    : items;

  if (pathnames.length === 0) {
    return null; 
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center py-4 px-8 backdrop-blur-md transition-all duration-300 border-b',
        isDark 
          ? 'bg-slate-900/20 border-white/5 text-slate-400' 
          : 'bg-white/40 border-slate-100 text-slate-500',
        className
      )}
    >
      <ol className="flex items-center space-x-2 md:space-x-3 overflow-hidden max-w-7xl mx-auto w-full">
        {visibleItems.map((item, index) => (
          <li key={index} className="flex items-center min-w-0">
            {index > 0 && (
              <div className="mx-2 flex-shrink-0 opacity-40">
                <ChevronRight size={14} />
              </div>
            )}

            {item.isLast ? (
              <span className={cn(
                "font-bold tracking-tight truncate max-w-[200px] text-xs uppercase",
                isDark ? "text-white" : "text-slate-900"
              )}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className={cn(
                  "group transition-all flex items-center gap-2 truncate max-w-[180px] text-xs font-bold uppercase tracking-widest",
                  isDark ? "hover:text-brand" : "hover:text-brand"
                )}
              >
                {item.icon && (
                  <span className={cn(
                    "p-1.5 rounded-lg transition-colors group-hover:scale-110 duration-200",
                    isDark ? "bg-white/5 group-hover:bg-brand/20" : "bg-slate-100 group-hover:bg-brand/10"
                  )}>
                    {item.icon}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;