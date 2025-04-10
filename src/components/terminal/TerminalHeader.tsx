import React from 'react';

// Minimal TerminalHeader component to make build pass
const TerminalHeader: React.FC = () => {
  return (
    <div className="p-2 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
      <div className="text-sm font-mono text-zinc-400">Syndicate Mind</div>
    </div>
  );
};

export default TerminalHeader;
