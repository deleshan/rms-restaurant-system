import React from 'react';
import { cn } from '@/utils/cn'; 
import LoadingSpinner from './LoadingSpinner';


const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled = false,
  icon: Icon,
  onClick,
  ...props
}) => {
  
  // Base styles for all kitchen buttons
  const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  // Variant-specific styles
  const variants = {
    primary: "bg-orange-600 text-white hover:bg-orange-500 focus:ring-orange-500 shadow-lg shadow-orange-900/20",
    secondary: "bg-slate-700 text-slate-100 hover:bg-slate-600 focus:ring-slate-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-500 focus:ring-emerald-500 shadow-lg shadow-emerald-900/20",
    danger: "bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500 shadow-lg shadow-rose-900/20",
    outline: "border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white focus:ring-slate-500",
    ghost: "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:ring-slate-700",
  };

  // Size variations
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-lg", 
    xl: "px-10 py-5 text-xl w-full", 
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner size="sm" color="white" />
          <span>Processing...</span>
        </div>
      ) : (
        <>
          {Icon && <Icon className={cn("w-5 h-5", children ? "mr-2" : "")} />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;