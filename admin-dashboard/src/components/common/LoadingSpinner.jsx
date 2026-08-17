import React from 'react';
import { Loader2 } from 'lucide-react'; 
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';

const LoadingSpinner = ({
  message = 'Loading...',
  size = 'default',      
  fullScreen = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'w-6 h-6 stroke-[2.5px]',
    default: 'w-10 h-10 stroke-[2px]',
    lg: 'w-16 h-16 stroke-[1.5px]',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 blur-xl bg-brand/20 animate-pulse rounded-full" />
        
        <Loader2
          className={cn(
            "animate-spin relative z-10 transition-colors duration-300",
            "text-brand",
            sizeClasses[size] || sizeClasses.default
          )}
        />
      </div>
      
      {message && (
        <p className={cn(
          "font-bold text-lg tracking-tight animate-pulse transition-colors duration-300",
          isDark ? "text-slate-300" : "text-slate-700"
        )}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn(
        "fixed inset-0 backdrop-blur-md flex items-center justify-center z-[100] transition-all duration-500",
        isDark ? "bg-slate-950/60" : "bg-white/40",
        className
      )}>
        {spinner}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center min-h-[200px] w-full transition-colors duration-300",
      className
    )}>
      {spinner}
    </div>
  );
};

export default LoadingSpinner;