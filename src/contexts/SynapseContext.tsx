import React, { createContext, useContext, useState, useEffect } from 'react';
import { SyndicateContextType, UserCustomization } from './types';
import { useApiKey } from '@/hooks/useApiKey';
import { useThoughts } from '@/hooks/useThoughts';
import { useSyndicateActions } from '@/hooks/useSyndicateActions';
import { useUserProfile } from '@/hooks/useUserProfile';
import { syndicateDB } from '@/lib/db'; // Import the database instance
import { useInputHandling } from '@/hooks/useInputHandling';

// Create the context with a default undefined value
const SyndicateContext = createContext<SyndicateContextType | undefined>(undefined);

export const SyndicateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("Rendering SyndicateProvider");
  
  // Initialize hideChatHistory from localStorage
  const [hideChatHistory, setHideChatHistory] = useState<boolean>(() => {
    const savedValue = localStorage.getItem('syndicate-hide-chat-history');
    console.log("Initial hideChatHistory from localStorage:", savedValue);
    return savedValue === 'true';
  });
  
  // Initialize customization settings from localStorage
  const [customization, setCustomization] = useState<UserCustomization>(() => {
    const savedCustomization = localStorage.getItem('syndicate-customization');
    console.log("Initial customization from localStorage:", savedCustomization);
    return savedCustomization ? JSON.parse(savedCustomization) : { 
      displayTags: true,
      showContinuationSuggestions: false
    };
  });
  
  // Save hideChatHistory to localStorage whenever it changes
  useEffect(() => {
    console.log("Saving hideChatHistory to localStorage:", hideChatHistory);
    localStorage.setItem('syndicate-hide-chat-history', hideChatHistory.toString());
  }, [hideChatHistory]);
  
  // Save customization to localStorage whenever it changes
  useEffect(() => {
    console.log("Saving customization to localStorage:", customization);
    localStorage.setItem('syndicate-customization', JSON.stringify(customization));
  }, [customization]);
  
  // Initialize API key management
  const { apiKey, setApiKey } = useApiKey();
  
  // Initialize thoughts management with the enhanced hooks
  const { 
    thoughts, 
    setThoughts,
    allThoughts,
    addThought,
    updateThought,
    clearCurrentThoughts,
    clearedSession
  } = useThoughts(hideChatHistory);
  
  // Initialize user profile management
  const { userProfile, updateUserProfile } = useUserProfile(apiKey);
  
  // Initialize syndicate actions with the updated parameters
  const { 
    isProcessing, 
    commandHistory, 
    historyIndex, 
    setHistoryIndex,
    handleInput,
    processCommand,
    searchThoughts,
    getRecentThoughts,
    clearChatHistory,
    logout: logoutAction
  } = useSyndicateActions(
    apiKey, 
    thoughts, 
    setThoughts, 
    addThought,
    updateThought,
    clearCurrentThoughts,
    hideChatHistory,
    setHideChatHistory,
    clearedSession
  );
  
  // Update customization settings
  const updateCustomization = (settings: Partial<UserCustomization>) => {
    setCustomization(prev => ({ ...prev, ...settings }));
  };
  
  // Logout wrapper
  const logout = () => {
    setApiKey('');
    logoutAction();
  };
  
  // Create context value with the updated structure
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
    processCommand,
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
    syndicateDB // Add the database instance to the context
  };

  console.log("SyndicateProvider value created with", {
    thoughts: thoughts.length,
    allThoughts: allThoughts.length,
    hideChatHistory,
    customization,
    hasDatabase: !!syndicateDB // Log whether the database is available
  });
  
  return (
    <SyndicateContext.Provider value={contextValue}>
      {children}
    </SyndicateContext.Provider>
  );
};

// Export the hook with better error handling
export const useSyndicate = (): SyndicateContextType => {
  const context = useContext(SyndicateContext);
  if (context === undefined) {
    throw new Error('useSyndicate must be used within a SyndicateProvider');
  }
  return context;
};
