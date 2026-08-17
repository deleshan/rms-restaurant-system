import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn'; 
import { useTheme } from '@/hooks/useTheme';

const StepIndicator = ({ 
  currentStep, 
  totalSteps = 4,
  labels = ["Business", "Location", "Operations", "Admin"],
  className 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className={cn("w-full py-8 px-4", className)}>
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        
        {/* Background Track */}
        <div className={cn(
          "absolute top-1/2 left-0 w-full h-[3px] -translate-y-1/2 z-0 rounded-full transition-colors duration-500",
          isDark ? "bg-white/5" : "bg-slate-100"
        )} />
        
        {/* Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-[3px] bg-brand -translate-y-1/2 transition-all duration-700 ease-in-out z-0 rounded-full shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)]" 
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = currentStep > step;
          const isActive = currentStep === step;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                  "backdrop-blur-md",
                  isCompleted ? [
                    "bg-brand border-brand text-white shadow-lg shadow-brand/20",
                    "scale-100"
                  ] : isActive ? [
                    "bg-white dark:bg-slate-800 border-brand text-brand shadow-xl scale-110",
                    isDark ? "shadow-brand/20" : "shadow-slate-200"
                  ] : [
                    "bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400",
                    "scale-90"
                  ]
                )}
              >
                {isCompleted ? (
                  <Check size={22} strokeWidth={3} className="animate-in zoom-in duration-300" />
                ) : (
                  <span className="text-sm font-black italic uppercase">{step}</span>
                )}
              </div>
              
              {/* Label */}
              <div className="absolute -bottom-10 flex flex-col items-center">
                <span className={cn(
                  "text-[10px] uppercase tracking-[0.2em] font-black transition-all duration-300 text-center",
                  isActive 
                    ? "text-brand translate-y-0 opacity-100" 
                    : isCompleted 
                    ? "text-slate-400 dark:text-slate-500 opacity-80"
                    : "text-slate-300 dark:text-slate-600 opacity-50 translate-y-1"
                )}>
                  {labels[step - 1]}
                </span>
                
                {/* Active Underline Dot */}
                {isActive && (
                  <div className="w-1 h-1 bg-brand rounded-full mt-1 animate-ping" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;