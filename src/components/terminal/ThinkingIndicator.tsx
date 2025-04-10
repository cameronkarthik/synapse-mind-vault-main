
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ThinkingIndicatorProps {
  errorMessage?: string;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ errorMessage }) => {
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>("Syndicate is thinking");
  
  // Reset progress when component mounts or dismounts
  useEffect(() => {
    setProgress(0);
    
    return () => {
      // Cleanup when component unmounts
      setProgress(0);
      setMessage("Syndicate is thinking");
    };
  }, []);
  
  // Handle error state
  useEffect(() => {
    if (errorMessage) {
      setProgress(100); // Complete the progress bar
      setMessage("Processing complete, but there was an error");
    }
  }, [errorMessage]);
  
  // Simulate gradual progress to provide visual feedback
  useEffect(() => {
    if (errorMessage) return; // Don't continue animation if there's an error
    
    const maxProgress = 90; // Stop at 90% to indicate we're still waiting
    const interval = setInterval(() => {
      setProgress(prev => {
        // Gradually slow down as we approach maxProgress
        const increment = Math.max(0.5, (maxProgress - prev) / 10);
        const newProgress = Math.min(maxProgress, prev + increment);
        
        // Update the message based on progress
        if (newProgress > 75 && message !== "Working on a complex response...") {
          setMessage("Working on a complex response...");
        }
        
        return newProgress;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [errorMessage, message]);
  
  return (
    <div className="flex flex-col items-center justify-center py-4 px-2">
      <div className="flex items-center gap-2 mb-2">
        {errorMessage ? (
          <div className="text-yellow-500">{message}</div>
        ) : (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-synapse-purple" />
            <div className="typing-animation text-gray-400">{message}</div>
          </>
        )}
      </div>
      
      <div className="w-full max-w-md">
        <Progress 
          value={progress} 
          className={`h-1 ${errorMessage ? 'bg-yellow-700' : 'bg-gray-700'}`} 
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {errorMessage ? (
            <span className="text-yellow-500">Error: {errorMessage}</span>
          ) : (
            progress > 75 ? "Working on a complex response..." : "Processing your input..."
          )}
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
