import React from 'react';
import PropTypes from 'prop-types';
import { MdErrorOutline, MdRefresh } from 'react-icons/md';
import { logger } from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    logger.error('Error caught by boundary:', error, errorInfo);
    
    // Store error info for display
    this.setState({ errorInfo });
    
    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#1f1f1f] px-4">
          <div className="max-w-md w-full text-center">
            <MdErrorOutline className="mx-auto text-6xl text-red-500 mb-4" />
            <h2 className="text-red-400 text-2xl font-bold mb-2">
              Something went wrong
            </h2>
            <p className="text-[#ababab] text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-[#262626] border border-[#343434] rounded-lg text-left">
                <p className="text-red-400 text-xs font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-[#ababab] text-xs">
                    <summary className="cursor-pointer mb-2">Stack trace</summary>
                    <pre className="overflow-auto max-h-40 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#262626] text-[#f5f5f5] rounded-lg hover:bg-[#343434] border border-[#343434] transition-colors flex items-center gap-2"
              >
                <MdRefresh size={18} />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-[#f6b100] text-[#1f1f1f] rounded-lg font-semibold hover:bg-[#e5a000] transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
