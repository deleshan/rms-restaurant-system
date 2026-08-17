import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/common/Button'; // Use your updated Button
import { cn } from '@/utils/cn';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 transition-colors duration-300">
          {/* Glass Card Container */}
          <div className={cn(
            "max-w-md w-full rounded-[2.5rem] p-8 text-center backdrop-blur-xl border transition-all duration-300",
            "bg-white/60 border-white/60 shadow-2xl shadow-gray-200/50",
            "dark:bg-slate-900/60 dark:border-white/10 dark:shadow-black/40"
          )}>
            
            {/* Error Icon */}
            <div className="mx-auto w-20 h-20 bg-rose-500/10 dark:bg-rose-500/20 rounded-3xl flex items-center justify-center mb-6 rotate-3">
              <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              Oops! System Glitch
            </h2>

            <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
              Something went wrong while processing this view. Our kitchen staff is on it!
            </p>

            {/* Dev Mode Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-5 bg-slate-950/5 dark:bg-white/5 rounded-2xl text-left text-xs font-mono overflow-auto max-h-40 border border-slate-200 dark:border-white/10">
                <p className="font-bold text-rose-600 dark:text-rose-400 mb-2 uppercase tracking-widest">Debug Info:</p>
                <pre className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 opacity-50 text-[10px] leading-tight">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons using your updated Button component */}
            <div className="flex flex-col gap-3">
              <Button 
                onClick={this.handleRetry}
                variant="primary"
                fullWidth
                leftIcon={<RefreshCw size={18} />}
              >
                Try Again
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  leftIcon={<RefreshCw size={16} />}
                >
                  Reload
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="ghost"
                  leftIcon={<Home size={16} />}
                >
                  Home
                </Button>
              </div>
            </div>

            <p className="mt-8 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Restaurant Management System v1.0
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (Component) => (props) => (
  <ErrorBoundary>
    <Component {...props} />
  </ErrorBoundary>
);

export default ErrorBoundary;