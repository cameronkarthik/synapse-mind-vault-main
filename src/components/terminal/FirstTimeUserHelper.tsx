import React, { useEffect } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { toast } from '@/hooks/use-toast';
import ApiKeyDialog from '../ApiKeyDialog';

interface FirstTimeUserHelperProps {
  apiKey: string;
}

const FirstTimeUserHelper: React.FC<FirstTimeUserHelperProps> = ({ apiKey }) => {
  const { handleInput } = useSyndicate();

  useEffect(() => {
    // Check if this is a first-time user (no history yet)
    const hasUsedBefore = localStorage.getItem('syndicate-first-use');
    
    if (!hasUsedBefore) {
      // Set the flag for future sessions
      localStorage.setItem('syndicate-first-use', 'true');
      
      // Add a slight delay so the UI has time to render first
      const timer = setTimeout(() => {
        // Automatically run the help command for first-time users
        handleInput('/help');
        toast({
          title: "Welcome to Syndicate Mind",
          description: "Type /help anytime to see available commands."
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [handleInput]);

  if (!apiKey) {
    return (
      <div className="bg-synapse-dark/50 border border-synapse-purple/20 rounded-lg p-6 mb-4 mx-4">
        <h3 className="text-lg font-semibold text-synapse-purple mb-2">Welcome to Syndicate Mind!</h3>
        <p className="text-gray-300 mb-4">
          You can start using basic features like journal entries and note-taking right away. For advanced AI-powered features 
          like thought summarization and intelligent tagging, you'll need to add your OpenAI API key.
        </p>
        <div className="flex items-center gap-4">
          <ApiKeyDialog />
          <button
            onClick={() => handleInput('/help')}
            className="px-4 py-2 bg-synapse-dark hover:bg-synapse-dark/80 text-gray-300 rounded border border-gray-700"
          >
            View Commands
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FirstTimeUserHelper;
