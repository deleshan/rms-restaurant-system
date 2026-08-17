import React from 'react';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';

const Badge = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      rounded = 'full', // 'sm', 'md', 'lg', 'full'
      dot = false,      
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const badgeVariants = {
      default: isDark ? 'bg-slate-800 text-slate-300 border-white/5' : 'bg-slate-100 text-slate-700 border-slate-200',
      primary: isDark ? 'bg-brand/20 text-brand border-brand/30' : 'bg-brand/10 text-brand border-brand/20',
      success: isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
      danger: isDark ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200',
      info: isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200',
      purple: isDark ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-violet-50 text-violet-700 border-violet-200',
      outline: isDark ? 'bg-transparent border-white/20 text-slate-300' : 'bg-transparent border-slate-300 text-slate-600',
      ghost: 'bg-transparent border-transparent text-slate-500',
    };

    const badgeSizes = {
      sm: 'px-2 py-0.5 text-[10px] gap-1',
      default: 'px-3 py-1 text-xs gap-1.5',
      lg: 'px-4 py-1.5 text-sm gap-2',
    };

    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-xl',
      full: 'rounded-full',
    };

    const dotColors = {
      success: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
      danger: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
      info: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
      primary: 'bg-brand shadow-[0_0_8px_rgba(var(--brand-rgb),0.5)]',
      purple: 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]',
      default: 'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-bold border transition-all duration-300 uppercase tracking-wider whitespace-nowrap',
          badgeVariants[variant],
          badgeSizes[size],
          roundedClasses[rounded],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0 animate-pulse',
              dotColors[variant] || dotColors.default
            )}
          />
        )}

        {icon && (
          <span className={cn(
            "flex-shrink-0",
            size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
          )}>
            {icon}
          </span>
        )}

        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;