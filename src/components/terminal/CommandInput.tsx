import React from 'react';

// Minimal CommandInput component to make build pass
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