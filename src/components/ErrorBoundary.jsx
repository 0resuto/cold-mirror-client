import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Widget Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-brand-bg/90 border border-red-500/50 rounded-xl backdrop-blur-md p-4 shadow-2xl">
          <AlertTriangle className="text-red-500 mb-2" size={32} />
          <h2 className="text-red-500 font-bold text-lg mb-1">Widget Crashed</h2>
          <p className="text-white/70 text-[10px] text-center font-mono break-words max-w-[250px] overflow-hidden mb-3">
            {this.state.error?.message || 'Unknown render error'}
          </p>
          <button 
            onClick={this.handleRetry}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
