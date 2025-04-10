import React from 'react';
import { Terminal } from 'lucide-react';

const TerminalHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between bg-zinc-950 rounded-t-md p-3 border-b border-zinc-800 text-white">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      
      <div className="flex items-center text-zinc-400 text-sm font-mono">
        <Terminal className="h-4 w-4 mr-2 text-zinc-500" />
        syndicate ~ mind $ 
      </div>
      
      <div className="w-[73px]">
        {/* Empty div for balanced layout - same width as the dots on the left */}
      </div>
    </div>
  );
};

export default TerminalHeader;
