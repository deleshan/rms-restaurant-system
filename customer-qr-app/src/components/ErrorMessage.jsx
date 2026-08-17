import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;
  const displayMessage = typeof message === 'object' 
    ? (message.message || JSON.stringify(message)) 
    : message;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mx-auto mb-6">
          <svg className="w-20 h-20 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>

        {/* Use displayMessage instead of raw message */}
        <p className="text-gray-600 mb-8">
          {displayMessage}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-md"
          >
            Try Again
          </button>
        )}

        {!onRetry && (
          <p className="text-sm text-gray-500 mt-6">
            Please check your internet connection or refresh the page.
          </p>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;