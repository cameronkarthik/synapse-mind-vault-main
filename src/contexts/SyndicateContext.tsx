import React, { createContext, useContext, useState, useEffect } from 'react';
// Make sure the path to types.ts is correct
import { SyndicateContextType, UserCustomization, Thought } from './types';
import { useApiKey } from '@/hooks/useApiKey';
import { useThoughts } from '@/hooks/useThoughts';
import { useSyndicateActions } from '@/hooks/useSyndicateActions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { syndicateDB } from '@/lib/db'; // Import the database instance

// Create the context with a default undefined value
const SyndicateContext = createContext<SyndicateContextType | undefined>(undefined);

export const SyndicateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("Rendering SyndicateProvider");

  // --- State for settings loaded from localStorage ---
  const [hideChatHistory, setHideChatHistory] = useState<boolean>(() => {
    try {
        const savedValue = localStorage.getItem('syndicate-hide-chat-history');
        console.log("Initial hideChatHistory from localStorage:", savedValue);
        return savedValue === 'true';
    } catch (e) { console.error("Error reading hideChatHistory from localStorage", e); return false; }
  });

  const [customization, setCustomization] = useState<UserCustomization>(() => {
    try {
        const savedCustomization = localStorage.getItem('syndicate-customization');
        console.log("Initial customization from localStorage:", savedCustomization);
        return savedCustomization ? JSON.parse(savedCustomization) : {
          displayTags: true,
          showContinuationSuggestions: false
        };
    } catch(e) { console.error("Error reading customization from localStorage", e); return { displayTags: true, showContinuationSuggestions: false }; }
  });

  // --- Effects to save settings to localStorage ---
  useEffect(() => {
     try {
         console.log("Saving hideChatHistory to localStorage:", hideChatHistory);
         localStorage.setItem('syndicate-hide-chat-history', hideChatHistory.toString());
     } catch (e) { console.error("Error saving hideChatHistory to localStorage", e); }
  }, [hideChatHistory]);

  useEffect(() => {
    try {
        console.log("Saving customization to localStorage:", customization);
        localStorage.setItem('syndicate-customization', JSON.stringify(customization));
    } catch (e) { console.error("Error saving customization to localStorage", e); }
  }, [customization]);

  // --- Calling Custom Hooks ---
  const { apiKey, setApiKey } = useApiKey();
  const {
    thoughts,
    allThoughts,
    addThought,
    updateThought,
    clearCurrentThoughts,
    clearedSession // Make sure this is returned by useThoughts if used
  } = useThoughts(hideChatHistory); // Pass hideChatHistory if the hook needs it

  const { userProfile, updateUserProfile } = useUserProfile(apiKey);

  // Assuming useSyndicateActions now returns processCommand correctly
   const {
     isProcessing,
     commandHistory,
     historyIndex,
     setHistoryIndex,
     handleInput,
     // Assuming processCommand is returned by this hook
     processCommand,
     searchThoughts,
     getRecentThoughts,
     clearChatHistory,
     logout: logoutAction // Renaming to avoid conflict with logout wrapper below
   } = useSyndicateActions(
       // Ensure all required arguments are passed
       apiKey,
       thoughts,
       // Pass setThoughts from useThoughts if needed by useSyndicateActions
       // If useThoughts doesn't return setThoughts, you might need to manage it differently
       // For now, assuming useThoughts provides it or it needs to be handled within SyndicateProvider
       () => {}, // Placeholder for setThoughts - ** FIX THIS based on useThoughts hook **
       addThought,
       updateThought,
       clearCurrentThoughts,
       hideChatHistory,
       setHideChatHistory,
       clearedSession // Pass clearedSession if needed
   );

  // --- Context Helper Functions ---
  const updateCustomization = (settings: Partial<UserCustomization>) => {
    setCustomization(prev => ({ ...prev, ...settings }));
  };

  // Wrapper for logout logic
  const logout = () => {
    setApiKey(''); // Clear API key state
    if (logoutAction) logoutAction(); // Call the logout from the hook if it exists
    // Add any other logout cleanup logic here
  };

  // --- Assemble the Context Value ---
  // Ensure all properties match the SyndicateContextType interface
  const contextValue: SyndicateContextType = {
    apiKey,
    setApiKey,
    thoughts,
    allThoughts,
    addThought,
    updateThought,
    isProcessing,
    commandHistory,
    historyIndex,
    setHistoryIndex,
    handleInput,
    processCommand, // Make sure this is correctly provided
    searchThoughts,
    getRecentThoughts,
    userProfile,
    updateUserProfile,
    hideChatHistory,
    setHideChatHistory,
    clearChatHistory,
    logout,
    customization,
    updateCustomization,
    syndicateDB // Include the imported db instance
  };

  console.log("SyndicateProvider value created", { hasDb: !!syndicateDB });

  return (
    <SyndicateContext.Provider value={contextValue}>
      {children}
    </SyndicateContext.Provider>
  );
};

// Hook for consuming the context
export const useSyndicate = (): SyndicateContextType => {
  const context = useContext(SyndicateContext);
  if (context === undefined) {
    // This error means a component tried to use the context
    // without being wrapped in SyndicateProvider
    throw new Error('useSyndicate must be used within a SyndicateProvider');
  }
  return context;
}; 