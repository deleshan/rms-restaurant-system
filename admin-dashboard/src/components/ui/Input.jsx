import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const Input = forwardRef(({
  className,
  label,
  error,
  helperText,
  icon: IconData, 
  iconPosition = 'left',
  fullWidth = true,
  disabled = false,
  required = false,
  type = 'text',
  ...props
}, ref) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const hasError = !!error;
  const hasIcon = !!IconData;

  const renderIcon = () => {
    if (!IconData) return null;

    const iconProps = {
      className: cn(
        'h-5 w-5 transition-colors duration-200',
        disabled 
          ? (isDark ? 'text-slate-600' : 'text-slate-300') 
          : hasError 
          ? 'text-rose-500' 
          : (isDark ? 'text-slate-400' : 'text-slate-400')
      )
    };

    if (typeof IconData === 'function' || (typeof IconData === 'object' && IconData.render)) {
      return <IconData {...iconProps} />;
    }
    return React.cloneElement(IconData, iconProps);
  };

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={props.id || props.name}
          className={cn(
            'block text-xs font-black uppercase tracking-widest transition-colors duration-200',
            hasError 
              ? 'text-rose-500' 
              : (isDark ? 'text-slate-400' : 'text-slate-500'),
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative group">
        {/* Left Icon Slot */}
        {hasIcon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            {renderIcon()}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          className={cn(
            // Base Styles
            'block w-full rounded-2xl border px-4 py-3 text-sm transition-all duration-300',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-4',
            
            // Theme-aware Surface
            isDark 
              ? 'bg-slate-900/40 border-white/10 text-white focus:bg-slate-900/60' 
              : 'bg-white/60 border-slate-200 text-slate-900 focus:bg-white',
            
            // Interaction & Focus
            hasError
              ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500'
              : 'focus:ring-brand/10 focus:border-brand',
            
            // Icon Padding
            hasIcon && iconPosition === 'left' && 'pl-11',
            hasIcon && iconPosition === 'right' && 'pr-11',
            
            // Disabled State
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:grayscale-[0.5]',
            
            className
          )}
          disabled={disabled}
          {...props}
        />

        {/* Right Icon Slot / Error Icon */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
          {hasIcon && iconPosition === 'right' ? (
            renderIcon()
          ) : hasError ? (
            <AlertCircle className="h-5 w-5 text-rose-500 animate-in zoom-in duration-300" />
          ) : null}
        </div>
      </div>

      {(helperText || hasError) && (
        <p className={cn(
          'text-[11px] font-bold uppercase tracking-wider mt-1 px-1 transition-all duration-300',
          hasError ? 'text-rose-500' : 'text-slate-400'
        )}>
          {hasError ? error : helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;