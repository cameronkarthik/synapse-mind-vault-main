import React, { useRef, memo } from 'react';
import TerminalHeader from './TerminalHeader';
import TerminalOutput from './TerminalOutput';
import CommandInput from './CommandInput';

// Memoize child components to prevent unnecessary re-renders
const MemoizedTerminalHeader = memo(TerminalHeader);
const MemoizedTerminalOutput = memo(TerminalOutput);
const MemoizedCommandInput = memo(CommandInput);

const MainTerminalView: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={terminalRef}
      className="relative flex flex-col w-full max-w-4xl mx-auto rounded-md shadow-xl overflow-hidden border border-zinc-800 bg-zinc-950/95"
    >
      <MemoizedTerminalHeader />
      <div className="flex-1 overflow-hidden">
        <MemoizedTerminalOutput />
      </div>
      <MemoizedCommandInput />
    </div>
  );
};

export default memo(MainTerminalView);
