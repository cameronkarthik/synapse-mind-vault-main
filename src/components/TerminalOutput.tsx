import React, { useRef, useEffect, memo, useState, useCallback, ComponentProps, ClassAttributes, HTMLAttributes } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext'; // Assuming this is the correct path now
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Import ScrollBar too
// --- IMPORTANT: Check these import paths match your actual file locations ---
import WelcomeScreen from './WelcomeScreen';
import ThoughtsList from './ThoughtsList';
import HistoryCollapsible from './HistoryCollapsible';
import ThinkingIndicator from './ThinkingIndicator';
import ScrollToBottomButton from './ScrollToBottomButton';
import HomeIntro from '../HomeIntro'; // Assumes HomeIntro.tsx is in src/components/
// --- End Check ---
import { Thought } from '@/contexts/types';
import ReactMarkdown, { Options } from 'react-markdown';
import { CodeProps } from 'react-markdown/lib/ast-to-react'; // Import specific type for code props

// Helper function to check for markdown
const isMarkdown = (text: string): boolean => {
  // Simple check for common markdown elements (headings, lists, code blocks/inline)
  return /^#|^\s*[-*+] |\`.*?\`|```/.test(text);
};

// Corrected Custom Code Component Renderer
const CustomCodeComponent: React.FC<CodeProps> = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline) {
      // Block code: use <pre> and <code>
      return (
        <pre className="bg-zinc-800 text-zinc-300 p-3 rounded-md text-sm font-mono overflow-x-auto my-2">
          <code className={match ? `language-${match[1]}` : ''} {...props}>
            {String(children).replace(/\n$/, '')}
          </code>
        </pre>
      );
    } else {
      // Inline code: use <code>
      return (
        <code className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded-sm text-sm font-mono mx-0.5" {...props}>
          {children}
        </code>
      );
    }
};


// Render text with proper formatting - either as markdown or plain text with line breaks
const FormattedText = memo(({ text }: { text: string }) => {
  if (isMarkdown(text)) {
    return (
      // Apply prose styles to a wrapper div if needed, not directly to ReactMarkdown
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-zinc-300 mt-3 mb-2" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-base font-medium text-zinc-400 mt-2 mb-1" {...props} />,
            p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
            a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />, // Add target/rel for external links
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            // Use the corrected custom code component
            code: CustomCodeComponent,
            // Explicitly handle pre if needed, though CustomCodeComponent handles block code
            pre: ({ node, ...props }) => <>{props.children}</> // Simple pre wrapper if CustomCodeComponent handles styling
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  }

  // For non-markdown text, just add line breaks
  return (
    <div className="whitespace-pre-wrap">
      {text}
    </div>
  );
});


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
  
  // Modify the rendering of thoughts to use the new FormattedText component
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
        /* Pass FormattedText component correctly */
        <HistoryCollapsible allThoughts={allThoughts} recentCount={recentThoughts.length} FormattedTextComponent={FormattedText} />
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