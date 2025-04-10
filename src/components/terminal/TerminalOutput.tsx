import React, { useRef, useEffect, memo, useState } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Thought } from '@/contexts/types';
import ThoughtsList from './ThoughtsList';
import HomeIntro from '../HomeIntro';
import ThinkingIndicator from './ThinkingIndicator';
import HistoryCollapsible from './HistoryCollapsible';
import ScrollToBottomButton from './ScrollToBottomButton';
import { FormattedText } from './FormattedOutput';

// Use memo to prevent unnecessary renders
const MemoizedThoughtsList = memo(ThoughtsList);
const MemoizedHomeIntro = memo(HomeIntro);

const TerminalOutput: React.FC = () => {
  const { thoughts, isProcessing, hideChatHistory } = useSyndicate();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Filter recent thoughts - only show the last 10 if we have a lot
  const allThoughts = thoughts || [];
  const recentThoughts = allThoughts.slice(-10);
  
  // Handle scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!scrollAreaRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };
  
  // Scroll to bottom automatically on new thoughts or when processing starts
  useEffect(() => {
    if (scrollAreaRef.current && (!showScrollButton || isProcessing)) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [thoughts, isProcessing, showScrollButton]);
  
  return (
    <ScrollArea 
      className="p-4 bg-syndicate-dark bg-opacity-95 text-white h-full terminal-text relative"
      onScrollCapture={handleScroll}
      ref={scrollAreaRef}
    >
      {allThoughts.length === 0 ? (
        <MemoizedHomeIntro />
      ) : (
        <>
          <MemoizedThoughtsList 
            thoughts={recentThoughts} 
            FormattedTextComponent={FormattedText} 
          />
          
          {isProcessing && <ThinkingIndicator />}
        </>
      )}
      
      {!hideChatHistory && allThoughts.length > recentThoughts.length && (
        <HistoryCollapsible 
          allThoughts={allThoughts} 
          recentCount={recentThoughts.length} 
          FormattedTextComponent={FormattedText} 
        />
      )}
      
      {showScrollButton && !isProcessing && (
        <ScrollToBottomButton 
          onClick={() => {
            if (scrollAreaRef.current) {
              scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth'
              });
              setShowScrollButton(false);
            }
          }}
        />
      )}
    </ScrollArea>
  );
};

export default memo(TerminalOutput); 