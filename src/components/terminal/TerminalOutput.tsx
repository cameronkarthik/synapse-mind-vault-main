import React, { useRef, useEffect, memo, useState } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Thought } from '@/contexts/types';
import ReactMarkdown from 'react-markdown';

// Simplified Text Formatter Component
const FormattedText = memo(({ text }: { text: string }) => {
  return (
    <div className="whitespace-pre-wrap">
      {text}
    </div>
  );
});

// Simplified Terminal Output Component
const TerminalOutput: React.FC = () => {
  const { thoughts, isProcessing } = useSyndicate();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Filter recent thoughts
  const allThoughts = thoughts || [];
  const recentThoughts = allThoughts.slice(-10);
  
  // Handle scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };
  
  // Scroll to bottom automatically
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [thoughts, isProcessing]);
  
  // Basic render to make build pass
  return (
    <ScrollArea 
      className="p-4 bg-zinc-900 text-white h-full relative"
      onScrollCapture={handleScroll}
      ref={scrollAreaRef}
    >
      {allThoughts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold">Welcome to Syndicate Mind</h1>
          <p className="text-zinc-400">Start typing to save your thoughts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentThoughts.map((thought) => (
            <div key={thought.id} className="p-2 border border-zinc-800 rounded">
              <FormattedText text={thought.input} />
              {thought.output && (
                <div className="mt-2 p-2 bg-zinc-800 rounded">
                  <FormattedText text={thought.output} />
                </div>
              )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex items-center space-x-2 text-zinc-400">
              <div className="animate-pulse">Processing...</div>
            </div>
          )}
        </div>
      )}
      
      {showScrollButton && (
        <button
          className="fixed bottom-4 right-4 bg-zinc-800 p-2 rounded-full shadow-lg"
          onClick={() => {
            if (scrollAreaRef.current) {
              scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
              });
              setShowScrollButton(false);
            }
          }}
        >
          ↓
        </button>
      )}
    </ScrollArea>
  );
};

export default memo(TerminalOutput); 