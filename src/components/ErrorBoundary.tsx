import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log detailed error in production for debugging
    if (process.env.NODE_ENV === 'production') {
      console.error("Production Error Details:", {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    // You can also log the error to an error reporting service here
    // e.g., Sentry.captureException(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
          <div className="max-w-md w-full bg-[--bg-secondary] rounded-lg shadow-xl p-8 border border-[--border-color]">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-cinzel font-bold text-[--accent] mb-4">
                Oops! Something went wrong
              </h1>
              <p className="text-[--text-muted] mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              
              {/* Show error message in production too (for debugging) */}
              {this.state.error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded text-left">
                  <p className="text-sm font-mono text-red-400 break-all mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                    <pre className="text-xs text-red-300 overflow-auto max-h-40 mt-2">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-[--accent] text-[--accent-foreground] font-bold rounded-full hover:bg-[--accent-hover] transition-all transform hover:scale-105"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-[--bg-tertiary] text-[--text-primary] font-bold rounded-full hover:bg-[--bg-primary] transition-all border border-[--border-color]"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

