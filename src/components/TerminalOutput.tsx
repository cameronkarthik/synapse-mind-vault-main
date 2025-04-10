import React, { useRef, useEffect, memo, useState } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import WelcomeScreen from './terminal/WelcomeScreen';
import ThoughtsList from './terminal/ThoughtsList';
import HistoryCollapsible from './terminal/HistoryCollapsible';
import ScrollToBottomButton from './terminal/ScrollToBottomButton';
import { Thought } from '@/contexts/types';
import HomeIntro from './HomeIntro';
import ReactMarkdown from 'react-markdown';

// Use memo to prevent unnecessary renders
const MemoizedThoughtsList = memo(ThoughtsList);
const MemoizedHomeIntro = memo(HomeIntro);

const TerminalOutput: React.FC = () => {
  const { thoughts, isProcessing, userProfile, hideChatHistory, clearChatHistory } = useSyndicate();
  const outputEndRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [visibleThoughts, setVisibleThoughts] = useState<Thought[]>([]);
  const DEFAULT_VISIBLE_THOUGHTS = 3;
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastThoughtsLengthRef = useRef(thoughts ? thoughts.length : 0);
  const hasRenderedInitialThoughtsRef = useRef(false);

  // Log the thoughts received from context
  console.log("[DEBUG] TerminalOutput received thoughts from context:", thoughts);

  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("TerminalOutput rendering");
  }

  // Hook 10: Update visible thoughts whenever the thoughts array changes
  useEffect(() => {
    console.log("[DEBUG] TerminalOutput useEffect for thoughts update running. thoughts length:", thoughts?.length);
    if (!thoughts) return; 
    setVisibleThoughts(thoughts);
    lastThoughtsLengthRef.current = thoughts.length;
    hasRenderedInitialThoughtsRef.current = true;
  }, [thoughts, hideChatHistory]);

  // Hook 11: Scroll to bottom only when processing finishes and user hasn't scrolled
  useEffect(() => {
    if (!isProcessing && !userScrolled && outputEndRef.current) {
      const scrollElement = scrollAreaRef.current?.children[0];
      if (scrollElement) {
        const isNearBottom = Math.abs(scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight) < 100;
        if (!isNearBottom) {
           console.log("[DEBUG] Scrolling to bottom after processing finished");
           requestAnimationFrame(() => {
             outputEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
           });
        }
      }
    }
  }, [isProcessing, userScrolled]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50;
    
    if (!isAtBottom) {
      setUserScrolled(true);
      setShowScrollButton(true);
    } else {
      setUserScrolled(false);
      setShowScrollButton(false);
    }
  };

  // Use requestAnimationFrame for smoother scrolling
  useEffect(() => {
    if (visibleThoughts.length > lastThoughtsLengthRef.current && !userScrolled) {
      requestAnimationFrame(() => {
        outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    
    lastThoughtsLengthRef.current = visibleThoughts.length;
  }, [visibleThoughts.length, userScrolled]);

  const scrollToBottom = () => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setUserScrolled(false);
      setShowScrollButton(false);
    }
  };

  // Check if the last thought has an error or is incomplete
  const lastThought = visibleThoughts[visibleThoughts.length - 1];
  const hasIncompleteThought = lastThought && !lastThought.output;
  const hasErrorOutput = lastThought?.output?.startsWith('Error:');
  const errorMessage = hasErrorOutput ? lastThought.output.replace('Error:', '').trim() : undefined;
  
  // Log the visibleThoughts state before slicing
  console.log("[DEBUG] TerminalOutput visibleThoughts state:", visibleThoughts);
  
  const recentThoughts = visibleThoughts.slice(-DEFAULT_VISIBLE_THOUGHTS);
  const olderThoughts = visibleThoughts.slice(0, -DEFAULT_VISIBLE_THOUGHTS);
  
  // Log the thoughts being passed to ThoughtsList
  console.log("[DEBUG] TerminalOutput passing recentThoughts to ThoughtsList:", recentThoughts);
  
  // Conditional return check is now AFTER all hooks
  if (!thoughts || visibleThoughts.length === 0) {
    return (
      <ScrollArea className="p-4 bg-syndicate-dark bg-opacity-95 text-white h-full terminal-text relative">
        <MemoizedHomeIntro />
        <div ref={outputEndRef} id="output-end" className="h-1" />
      </ScrollArea>
    );
  }

  return (
    <ScrollArea 
      className="p-4 bg-syndicate-dark bg-opacity-95 text-white h-full terminal-text relative"
      onScrollCapture={handleScroll}
      ref={scrollAreaRef}
    >
      <div className="flex flex-col relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1"></div>
          <div className="flex-1 flex justify-center">
            {olderThoughts.length > 0 && (
              <HistoryCollapsible
                olderThoughts={olderThoughts}
                isHistoryOpen={isHistoryOpen}
                setIsHistoryOpen={setIsHistoryOpen}
                userProfile={userProfile}
              />
            )}
          </div>
          <div className="flex-1 flex justify-end">
            {/* TerminalActions component is removed as per the instructions */}
          </div>
        </div>
      
        <div 
          className="thoughts-container w-full" 
          data-thoughts-count={visibleThoughts.length}
          data-hide-history={hideChatHistory}
        >
          <MemoizedThoughtsList 
            thoughts={recentThoughts} 
            userProfile={userProfile}
          />
        </div>
      </div>
      
      <ScrollToBottomButton
        showScrollButton={showScrollButton}
        scrollToBottom={scrollToBottom}
      />
      
      <div ref={outputEndRef} id="output-end" className="h-1" />
    </ScrollArea>
  );
};

export default memo(TerminalOutput);
