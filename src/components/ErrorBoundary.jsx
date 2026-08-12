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

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1b1e]/90 border border-[#e03131]/50 rounded-xl backdrop-blur-md p-4 shadow-2xl">
          <AlertTriangle className="text-[#e03131] mb-2" size={32} />
          <h2 className="text-[#e03131] font-bold text-lg mb-1">Widget Crashed</h2>
          <p className="text-white/70 text-[10px] text-center font-mono break-words max-w-[250px] overflow-hidden">
            {this.state.error?.message || 'Unknown render error'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
