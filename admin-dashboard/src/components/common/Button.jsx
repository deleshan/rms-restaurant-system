import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';

const buttonVariants = {
  default: 'bg-brand/90 text-white hover:bg-brand shadow-md shadow-brand/20 dark:shadow-brand/10 border border-brand/20 backdrop-blur-md transition-all duration-300',
  primary: 'bg-brand text-white hover:opacity-90 shadow-lg shadow-brand/40 dark:shadow-brand/20 border border-white/20 backdrop-blur-md transition-all duration-300 font-bold uppercase tracking-wider',
  outline: 'bg-white/40 dark:bg-slate-800/40 text-brand border border-brand/50 hover:bg-brand/10 backdrop-blur-sm transition-all duration-300',
  ghost: 'text-brand hover:bg-brand/15 dark:hover:bg-brand/10 transition-all duration-200',
  link: 'text-brand underline-offset-4 hover:underline transition-all',
  destructive: 'bg-rose-500/15 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-200/50 dark:border-rose-500/20 backdrop-blur-md',
  success: 'bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-200/50 dark:border-emerald-500/20 backdrop-blur-md',
  warning: 'bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-200/50 dark:border-amber-500/20 backdrop-blur-md',
};

const buttonSizes = {
  default: 'h-10 px-5 py-2',
  sm: 'h-8 rounded-xl px-3 text-xs',
  lg: 'h-12 rounded-2xl px-8 text-base font-semibold',
  icon: 'h-10 w-10 rounded-xl',
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading = false,
      isLoading,
      disabled = false,
      fullWidth = false,
      icon, 
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props 
    },
    ref
  ) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const isCurrentlyLoading = loading || isLoading;
    const finalLeftIcon = leftIcon || icon;

    const renderIcon = (IconData) => {
      if (!IconData) return null;
      const iconClasses = "h-4 w-4 shrink-0 transition-transform group-hover:scale-110";
      if (typeof IconData === 'function' || (typeof IconData === 'object' && IconData.render)) {
        return <IconData className={iconClasses} />;
      }
      return React.cloneElement(IconData, {
        className: cn(iconClasses, IconData.props?.className)
      });
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isCurrentlyLoading}
        className={cn(
          'group inline-flex items-center justify-center rounded-2xl text-sm font-medium transition-all duration-300',
          'focus-visible:ring-brand/40 focus-visible:ring-offset-2',
          isDark ? 'focus-visible:ring-offset-slate-950' : 'focus-visible:ring-offset-white',
          
          'disabled:pointer-events-none disabled:opacity-40 active:scale-[0.96]',
          buttonVariants[variant],
          buttonSizes[size],
          fullWidth && 'w-full',
          isCurrentlyLoading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {isCurrentlyLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin opacity-70" />
            {children && <span>{children}</span>}
            {!children && <span>Processing...</span>}
          </>
        ) : (
          <>
            {finalLeftIcon && (
              <span className="inline-flex mr-2 opacity-90 transition-opacity">
                {renderIcon(finalLeftIcon)}
              </span>
            )}
            
            <span className="relative z-10 inline-flex items-center gap-2">{children}</span>

            {rightIcon && (
              <span className="inline-flex ml-2 opacity-90 transition-opacity">
                {renderIcon(rightIcon)}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants, buttonSizes };
export default Button;