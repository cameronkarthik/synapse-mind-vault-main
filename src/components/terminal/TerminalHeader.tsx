
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface TerminalActionsProps {
  thoughts: any[];
  hideChatHistory: boolean;
  clearChatHistory: () => void;
}

const TerminalActions: React.FC<TerminalActionsProps> = ({ 
  thoughts, 
  hideChatHistory,
  clearChatHistory 
}) => {
  // Only show the clear button if there are thoughts and chat history is not already hidden
  if (!thoughts.length || hideChatHistory) {
    return null;
  }

  return (
    <Button
      onClick={clearChatHistory}
      variant="outline"
      size="sm"
      className="bg-syndicate-dark border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 gap-2"
    >
      <Trash2 className="h-4 w-4" />
      Clear Chat
    </Button>
  );
};

export default TerminalActions;
