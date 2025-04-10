import React, { useState, useEffect, Suspense } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import LoginView from './terminal/LoginView';
import MainTerminalView from './terminal/MainTerminalView';
import FirstTimeUserHelper from './terminal/FirstTimeUserHelper';
import { useToast } from '@/hooks/use-toast';

// Fallback loading component
const TerminalLoading = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-12 w-12 rounded-full bg-zinc-800 mb-4"></div>
      <div className="h-4 w-48 bg-zinc-800 rounded mb-2"></div>
      <div className="h-3 w-36 bg-zinc-800 rounded"></div>
    </div>
  </div>
);

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
  return (
    <div className="p-6 bg-red-950/10 text-red-300 rounded-lg border border-red-800/50 w-full max-w-4xl mx-auto">
      <h3 className="text-lg font-semibold text-red-200 mb-2">Terminal Initialization Error</h3>
      <p className="mb-4">The application encountered an error while loading. This is usually temporary.</p>
      <pre className="mt-2 text-xs p-2 rounded overflow-auto bg-black/30 text-red-200 max-h-32">
        {error.message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
      >
        Try Again
      </button>
    </div>
  );
};

// Error boundary wrapper
class TerminalErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}> {
  state = { hasError: false, error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Terminal error:", error, errorInfo);
  }
  
  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props;
      return <Fallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }
    
    return this.props.children;
  }
}

const Terminal: React.FC = () => {
  console.log("Rendering Terminal component");
  // Remove the local error state and TerminalContent wrapper
  // Hooks like useToast and useSyndicate should be called in components that need them (like MainTerminalView)
  
  return (
    <div className="w-full h-full flex flex-col">
      <TerminalErrorBoundary fallback={ErrorFallback}>
        <Suspense fallback={<TerminalLoading />}>
          {/* Render MainTerminalView directly */}
          <MainTerminalView /> 
        </Suspense>
      </TerminalErrorBoundary>
    </div>
  );
};

export default Terminal;
