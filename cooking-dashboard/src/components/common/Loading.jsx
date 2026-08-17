import React from 'react';

/**
 * Loading Component
 * @param {string} message - Optional text to display below the spinner
 * @param {boolean} fullScreen - If true, covers the entire viewport
 * @param {string} size - 'sm', 'md', 'lg'
 * @param {string} color - Tailwind color class (e.g., 'text-orange-500')
 */
const Loading = ({ 
  message = "Loading Kitchen Data...", 
  fullScreen = false, 
  size = 'md',
  color = 'text-orange-500'
}) => {
  
  // Size mapping for the spinner
  const sizes = {
    sm: "w-6 h-6 border-2",
    md: "w-12 h-12 border-4",
    lg: "w-20 h-20 border-8"
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer Ring (Static) */}
        <div className={`${sizes[size]} border-slate-700 rounded-full`}></div>
        
        {/* Inner Spinning Ring */}
        <div className={`absolute top-0 left-0 ${sizes[size]} ${color} border-t-transparent border-r-transparent rounded-full animate-spin`}></div>
      </div>
      
      {message && (
        <p className="text-slate-400 font-medium tracking-wide animate-pulse uppercase text-xs sm:text-sm">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 w-full">
      {spinnerContent}
    </div>
  );
};

export default Loading;