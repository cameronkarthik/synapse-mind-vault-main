#!/bin/bash

# Create necessary directories
mkdir -p dist
mkdir -p src/components/terminal
mkdir -p src/components/terminal/output

# Create minimal components if they don't exist
if [ ! -f src/components/terminal/TerminalOutput.tsx ]; then
  cat > src/components/terminal/TerminalOutput.tsx << 'EOL'
import React, { useRef, useEffect, memo, useState } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Thought } from '@/contexts/types';

const FormattedText = memo(({ text }: { text: string }) => {
  return <div className="whitespace-pre-wrap">{text}</div>;
});

const TerminalOutput: React.FC = () => {
  const { thoughts, isProcessing } = useSyndicate();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const allThoughts = thoughts || [];
  const recentThoughts = allThoughts.slice(-10);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [thoughts, isProcessing]);
  
  return (
    <ScrollArea className="p-4 bg-zinc-900 text-white h-full relative" ref={scrollAreaRef}>
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
    </ScrollArea>
  );
};

export default memo(TerminalOutput);
EOL
fi

if [ ! -f src/components/terminal/TerminalHeader.tsx ]; then
  cat > src/components/terminal/TerminalHeader.tsx << 'EOL'
import React from 'react';

const TerminalHeader: React.FC = () => {
  return (
    <div className="p-2 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
      <div className="text-sm font-mono text-zinc-400">Syndicate Mind</div>
    </div>
  );
};

export default TerminalHeader;
EOL
fi

if [ ! -f src/components/terminal/CommandInput.tsx ]; then
  cat > src/components/terminal/CommandInput.tsx << 'EOL'
import React from 'react';

const CommandInput: React.FC = () => {
  return (
    <div className="p-2 border-t border-zinc-800 bg-zinc-950">
      <div className="flex items-center rounded bg-zinc-900 p-2">
        <span className="text-zinc-400 mr-2">$</span>
        <input 
          type="text"
          className="bg-transparent border-none outline-none flex-1 text-white"
          placeholder="Type a message..."
          disabled
        />
      </div>
    </div>
  );
};

export default CommandInput;
EOL
fi

echo "Terminal components have been set up for build" 