import React, { useRef, useEffect, memo, useState } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import WelcomeScreen from './terminal/WelcomeScreen';
import ThoughtsList from './terminal/ThoughtsList';
import HistoryCollapsible from './terminal/HistoryCollapsible';
import ThinkingIndicator from './terminal/ThinkingIndicator';
import ScrollToBottomButton from './terminal/ScrollToBottomButton';
import { Thought } from '@/contexts/types';
import HomeIntro from './HomeIntro';
import ReactMarkdown from 'react-markdown';

// Helper function to check if the content is markdown (contains # headings or other markdown elements)
const isMarkdown = (text: string): boolean => {
  return /^#|^\s*-|\`.*\`|##/.test(text);
};

// Render text with proper formatting - either as markdown or plain text with line breaks
const FormattedText = memo(({ text }: { text: string }) => {
  if (isMarkdown(text)) {
    return (
      <ReactMarkdown
        className="prose prose-invert prose-sm max-w-none"
        components={{
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-zinc-300 mt-3 mb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-medium text-zinc-400 mt-2 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          code: ({ node, inline, ...props }) => 
            inline 
              ? <code className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-sm font-mono" {...props} />
              : <pre className="bg-zinc-800 text-zinc-300 p-2 rounded text-sm font-mono overflow-x-auto my-2" {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
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
  // ... rest of the component code ...

  // Modify the rendering of thoughts to use the new FormattedText component
  return (
    <ScrollArea 
      className="p-4 bg-syndicate-dark bg-opacity-95 text-white h-full terminal-text relative"
      onScrollCapture={handleScroll}
      ref={scrollAreaRef}
    >
      {/* ... existing code ... */}
      
      {/* When rendering individual thought outputs, use FormattedText */}
      {/* Find the place where thought output is rendered and replace with: */}
      {/* <FormattedText text={thought.output} /> */}
      
      {/* ... rest of the component ... */}

      {!hideChatHistory && allThoughts.length > recentThoughts.length && (
        <HistoryCollapsible allThoughts={allThoughts} recentCount={recentThoughts.length} FormattedTextComponent={FormattedText} />
      )}
    </ScrollArea>
  );
};

export default memo(TerminalOutput); 