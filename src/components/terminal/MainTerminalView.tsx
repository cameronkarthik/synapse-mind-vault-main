import React, { useRef, useEffect, memo } from 'react';
import TerminalHeader from '../TerminalHeader';
import TerminalOutput from '../TerminalOutput';
import CommandInput from '../CommandInput';
import { useSyndicate } from '@/contexts/SynapseContext';

// Memoize child components to prevent unnecessary re-renders
const MemoizedTerminalHeader = memo(TerminalHeader);
const MemoizedTerminalOutput = memo(TerminalOutput);
const MemoizedCommandInput = memo(CommandInput);

const MainTerminalView: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Get the context values safely - this component assumes the context is available
  // since it's only rendered when apiKey exists
  const { thoughts, isProcessing, hideChatHistory } = useSyndicate();
  
  // Ensure proper initial terminal positioning
  useEffect(() => {
    // Calculate ideal height based on golden ratio
    const setIdealHeight = () => {
      if (terminalRef.current) {
        const viewportHeight = window.innerHeight;
        // Using the golden ratio (1.618) for pleasing proportions
        // Terminal height is approximately 62% of the viewport height
        const idealTerminalHeight = Math.min(
          Math.floor(viewportHeight * 0.62), 
          700 // Cap at 700px max height for larger screens
        );
        
        terminalRef.current.style.height = `${idealTerminalHeight}px`;
        
        // Center the terminal in the viewport
        const terminalTop = Math.max(100, (viewportHeight - idealTerminalHeight) / 2 - 50);
        if (terminalTop > 0) {
          terminalRef.current.style.marginTop = `${terminalTop}px`;
        }
      }
    };
    
    // Set ideal height on first render
    setIdealHeight();
    
    // Update height on window resize
    window.addEventListener('resize', setIdealHeight);
    return () => window.removeEventListener('resize', setIdealHeight);
  }, []);
  
  // Add scroll management to prevent jolts
  // Inside the MainTerminalView component, after the existing useEffect

  // Add a new useEffect for smooth scrolling
  useEffect(() => {
    // Get the terminal container element
    const terminalContainer = document.querySelector('.terminal-output-container');
    if (!terminalContainer) return;
    
    // Function to scroll smoothly to bottom
    const scrollToBottom = () => {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const terminal = terminalContainer as HTMLElement;
        const scrollHeight = terminal.scrollHeight;
        
        // Use smooth scrolling with a gentle easing
        terminal.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      });
    };
    
    // React to changes in the thoughts array
    if (thoughts && thoughts.length > 0) {
      scrollToBottom();
    }
    
    // Also react to processing state changes
    if (isProcessing) {
      scrollToBottom();
    }
    
  }, [thoughts, isProcessing]);
  
  // Remove excessive logging that can slow down the app
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    // Reduced logging frequency - just initial render
    console.log("MainTerminalView rendering");
  }
  
  return (
    <div 
      ref={terminalRef}
      className="relative flex flex-col w-full max-w-4xl mx-auto rounded-md shadow-xl overflow-hidden border border-zinc-800 bg-zinc-950/95 transition-all duration-300"
      data-thoughts-count={thoughts?.length || 0}
      data-processing={isProcessing}
      data-hide-history={hideChatHistory}
      key="main-terminal-view"
    >
      <MemoizedTerminalHeader />
      <div className="flex-1 overflow-hidden terminal-output-container">
        <MemoizedTerminalOutput />
      </div>
      <MemoizedCommandInput />
    </div>
  );
};

export default memo(MainTerminalView);
