
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  hideChatHistory: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ hideChatHistory }) => {
  const navigate = useNavigate();
  
  const handleViewHistory = () => {
    navigate('/history');
  };
  
  if (hideChatHistory) {
    return (
      <div className="p-4 bg-syndicate-dark bg-opacity-95 text-white overflow-y-auto flex-1 terminal-text">
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="text-6xl mb-4 gradient-text">Chat Cleared</div>
          <p className="text-gray-400 max-w-md mb-4">
            Your workspace is now clear. Begin a new conversation below.
          </p>
          <p className="text-gray-400 max-w-md mb-6">
            All previous messages are still available in the History page.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center justify-center gap-2 bg-syndicate-dark border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={handleViewHistory}
          >
            <History className="h-4 w-4" />
            View Message History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-syndicate-dark bg-opacity-95 text-white overflow-y-auto flex-1 terminal-text">
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex items-center justify-center">
          <BrainCircuit className="h-16 w-16 text-syndicate-purple animate-pulse" />
        </div>
        <div className="text-6xl mb-4 gradient-text">Syndicate Mind</div>
        <p className="text-gray-300 max-w-md mb-6">
          Your expanded consciousness and digital memory system. 
          Journal your thoughts, vent your issues, or explore ideas.
        </p>
        <div className="bg-gray-900 bg-opacity-60 p-6 rounded-lg max-w-xl text-left">
          <h3 className="text-xl text-syndicate-purple mb-3">How to use your second brain:</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start">
              <span className="text-syndicate-purple mr-2">•</span> 
              <span>Journal daily thoughts and discoveries</span>
            </li>
            <li className="flex items-start">
              <span className="text-syndicate-purple mr-2">•</span> 
              <span>Tag memories with <span className="text-syndicate-purple">#tags</span> for easy recall</span>
            </li>
            <li className="flex items-start">
              <span className="text-syndicate-purple mr-2">•</span> 
              <span>Use <span className="text-syndicate-purple">/recall</span> to access memories by tag or keyword</span>
            </li>
            <li className="flex items-start">
              <span className="text-syndicate-purple mr-2">•</span> 
              <span>Use <span className="text-syndicate-purple">/summarize</span> to get insights from past thoughts</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
