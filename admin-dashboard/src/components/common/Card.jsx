import React from 'react';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';

const cardVariants = {
  // Primary Glass Style: Frosted, adapts to theme
  default: cn(
    'backdrop-blur-xl border transition-all duration-300',
    'bg-white/60 border-white/60 shadow-lg shadow-gray-200/30',
    'dark:bg-slate-900/60 dark:border-white/10 dark:shadow-black/20'
  ),
  
  // High-Definition Glass: Stronger border and blur
  elevated: cn(
    'backdrop-blur-2xl border transition-all duration-300',
    'bg-white/60 border-white shadow-xl shadow-gray-300/20 hover:bg-white/70',
    'dark:bg-slate-800/60 dark:border-white/20 dark:shadow-black/40 dark:hover:bg-slate-800/80'
  ),
  
  // Outline: Minimal edge
  outline: cn(
    'bg-transparent border transition-colors',
    'border-gray-200/50 hover:bg-white/20',
    'dark:border-slate-800 dark:hover:bg-slate-800/40'
  ),
  
  // Invisible glass
  ghost: 'bg-transparent border-none shadow-none',
  
  // Semantic Glass variants
  danger: 'bg-red-50/40 dark:bg-red-950/20 backdrop-blur-md border border-red-100 dark:border-red-900/30 text-red-900 dark:text-red-400',
  success: 'bg-emerald-50/40 dark:bg-emerald-950/20 backdrop-blur-md border border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-400',
  warning: 'bg-amber-50/40 dark:bg-amber-950/20 backdrop-blur-md border border-amber-100 dark:border-amber-900/30 text-amber-900 dark:text-amber-400',
};

const Card = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      title,
      description,
      headerActions,
      footer,
      icon, 
      loading = false,
      hoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[2rem] overflow-hidden transition-all duration-300', 
          cardVariants[variant],
          hoverable && [
            'hover:-translate-y-1.5',
            isDark ? 'hover:shadow-black/40 hover:bg-slate-800/70' : 'hover:shadow-2xl hover:bg-white/60'
          ],
          loading && 'opacity-75 animate-pulse',
          className
        )}
        {...props}
      >
        {/* Card Header */}
        {(title || description || icon || headerActions) && (
          <div className="px-8 pt-8 pb-3"> 
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                {title && (
                  <h3 className={cn(
                    "text-xs font-bold uppercase tracking-[0.15em]",
                    isDark ? "text-slate-400" : "text-slate-800"
                  )}>
                    {title}
                  </h3>
                )}
                {description && (
                  <p className={cn(
                    "text-sm font-medium",
                    isDark ? "text-slate-500" : "text-gray-500"
                  )}>
                    {description}
                  </p>
                )}
              </div>
              
              {/* Icon Slot */}
              {(icon || headerActions) && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {icon && (
                    <div className={cn(
                      "p-2.5 rounded-xl text-brand shadow-sm border transition-colors",
                      isDark ? "bg-slate-800 border-white/10" : "bg-white/60 border-white/80"
                    )}>
                      {icon}
                    </div>
                  )}
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="px-8 py-5">
          {loading ? (
            <div className="space-y-4">
              <div className={cn("h-10 rounded-xl w-3/4 animate-pulse", isDark ? "bg-slate-800" : "bg-gray-200/40")}></div>
              <div className={cn("h-4 rounded-xl w-full animate-pulse", isDark ? "bg-slate-800" : "bg-gray-200/40")}></div>
            </div>
          ) : (
            <div className={isDark ? "text-slate-200" : "text-slate-900"}>
              {children}
            </div>
          )}
        </div>

        {/* Card Footer */}
        {footer && (
          <div className={cn(
            "px-8 py-5 border-t transition-colors",
            isDark ? "border-white/5 bg-white/5" : "px-8 py-5 border-t border-white/40 bg-white/20"
          )}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Compositional Components
export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn('px-8 pt-8 pb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...props }) => {
  const { theme } = useTheme();
  return (
    <h3 className={cn(
      'text-xl font-bold tracking-tight',
      theme === 'dark' ? 'text-white' : 'text-gray-900',
      className
    )} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn('px-8 py-5', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }) => {
  const { theme } = useTheme();
  return (
    <div className={cn(
      'px-8 py-5 border-t',
      theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-white/40 bg-white/20',
      className
    )} {...props}>
      {children}
    </div>
  );
};

export default Card;