import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Spinner Animation */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>

        {/* Optional Message */}
        <p className="mt-6 text-lg font-medium text-gray-700">
          {message}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Please wait while we prepare your experience
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;