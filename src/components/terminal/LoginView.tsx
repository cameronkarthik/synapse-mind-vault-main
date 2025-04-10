
import React from 'react';
import ApiKeyDialog from '../ApiKeyDialog';
import TerminalHeader from '../TerminalHeader';

const LoginView: React.FC = () => {
  return (
    <div className="relative flex flex-col h-full max-w-4xl mx-auto rounded-md shadow-2xl overflow-hidden border border-gray-700">
      <TerminalHeader />
      <div className="flex-1 bg-synapse-dark flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">Login Required</h2>
          <p className="text-gray-400 mb-6">Please enter your OpenAI API key to access Syndicate Mind</p>
          <ApiKeyDialog />
        </div>
      </div>
    </div>
  );
};

export default LoginView;
