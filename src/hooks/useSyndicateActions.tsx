import { useState, useEffect, useCallback } from 'react';
import { Thought } from '@/contexts/types';
import { createCommandProcessor } from '@/contexts/commandProcessor';
import { syndicateDB } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useCommandHistory } from './useCommandHistory';
import { useThoughtProcessing } from './useThoughtProcessing';
import { useInputHandling } from './useInputHandling';
import { parseTagsFromInput } from '@/lib/utils';

export const useSyndicateActions = (
  apiKey: string,
  thoughts: Thought[],
  setThoughts: React.Dispatch<React.SetStateAction<Thought[]>>,
  addThought: (thought: Thought) => void,
  updateThought: (thought: Thought) => void,
  clearCurrentThoughts: () => void,
  hideChatHistory: boolean,
  setHideChatHistory: React.Dispatch<React.SetStateAction<boolean>>,
  clearedSession: boolean
) => {
  const toastObj = useToast();
  const [isProcessingState, setIsProcessingState] = useState<boolean>(false);

  // Initialize command history management
  const {
    commandHistory,
    historyIndex,
    setHistoryIndex,
    addToHistory
  } = useCommandHistory();

  // Initialize thought processing
  const {
    isProcessing,
    processInput
  } = useThoughtProcessing(apiKey, addThought, updateThought);

  // Initialize input handling
  const {
    handleInput,
    processCommand
  } = useInputHandling(
    apiKey,
    addToHistory,
    (isProcessing) => setIsProcessingState(isProcessing),
    async (userThought, cleanedInput, inputTags) => {
      await processInput(cleanedInput, userThought.timestamp);
    },
    addThought,
    updateThought,
    setHideChatHistory,
    hideChatHistory,
    clearedSession
  );

  // Initialize and store the command processor
  const commandProcessor = createCommandProcessor(apiKey);

  // Handle command (like /help, /recall, etc.)
  const handleCommand = useCallback(async (input: string) => {
    try {
      // Parse command and content
      const parts = input.trim().split(' ');
      const command = parts[0].substring(1); // Remove the / prefix
      const content = parts.slice(1).join(' ');
      
      // Get response from command processor
      const response = await commandProcessor.processCommand(command, content);
      
      // Create thought from command
      const commandThought: Thought = {
        timestamp: new Date().toISOString(),
        input: input,
        output: response,
        tags: ['command', command.toLowerCase()],
        summary: `Command: /${command}`
      };
      
      // Add to UI and save to database
      addThought(commandThought);
      await syndicateDB.saveThought(commandThought);
      
      // Update command history
      updateCommandHistory(input);
      
      // Handle special commands
      if (command === 'clear') {
        clearCurrentThoughts();
      } else if (command === 'journal' || command === 'note') {
        // For journal/note commands, save the content as a thought
        const journalThought: Thought = {
          timestamp: new Date().toISOString(),
          input: content,
          output: `Your ${command} has been saved.`,
          tags: command === 'journal' ? ['journal'] : ['note'],
          summary: content.length > 50 ? `${content.substring(0, 50)}...` : content
        };
        
        await syndicateDB.saveThought(journalThought);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      
      // Create error thought
      const errorThought: Thought = {
        timestamp: new Date().toISOString(),
        input: input,
        output: `Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`,
        tags: ['error', 'command'],
        summary: 'Command error'
      };
      
      // Add error thought and save to database
      addThought(errorThought);
      await syndicateDB.saveThought(errorThought);
    }
  }, [apiKey, addThought, clearCurrentThoughts]);

  // Update command history
  const updateCommandHistory = useCallback((command: string) => {
    setHistoryIndex(prev => {
      // Don't add duplicates of the last command
      if (prev > 0 && command === commandHistory[prev - 1]) {
        return prev;
      }
      
      // Add new command and limit history to 100 entries
      const newHistory = [...commandHistory.slice(-99), command];
      return newHistory.length;
    });
  }, [commandHistory]);

  const searchThoughts = useCallback(async (query: string): Promise<Thought[]> => {
    try {
      const results = await syndicateDB.searchThoughtsByContent(query);
      return results;
    } catch (error) {
      console.error('Error searching thoughts:', error);
      toastObj.toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      return [];
    }
  }, [toastObj]);

  const getRecentThoughts = useCallback(async (limit = 10): Promise<Thought[]> => {
    try {
      return await syndicateDB.getRecentThoughts(limit);
    } catch (error) {
      console.error('Error getting recent thoughts:', error);
      return [];
    }
  }, []);

  const clearChatHistory = useCallback(async () => {
    console.log("[DEBUG] clearChatHistory action started");
    try {
      // Only clear UI, don't delete from database
      clearCurrentThoughts();
      
      toastObj.toast({
        title: 'Chat cleared',
        description: 'Your chat history has been cleared from view.',
      });
      
      // Refresh thoughts in context if needed
      if (!hideChatHistory) {
        setHideChatHistory(true);
        setTimeout(() => setHideChatHistory(false), 100); // Toggle to refresh
      }
      console.log("[DEBUG] clearChatHistory action finished successfully");
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toastObj.toast({
        title: 'Error',
        description: 'Failed to clear chat history.',
        variant: 'destructive',
      });
    }
  }, [clearCurrentThoughts, toastObj, hideChatHistory, setHideChatHistory]);

  const logout = useCallback(() => {
    localStorage.removeItem('syndicate-openai-key');
    
    toastObj.toast({
      title: 'Logged Out',
      description: 'You have been logged out. Please provide your API key to log back in.',
    });
  }, [toastObj]);

  return {
    isProcessing,
    commandHistory,
    historyIndex,
    setHistoryIndex,
    handleInput,
    processCommand,
    searchThoughts,
    getRecentThoughts,
    clearChatHistory,
    logout
  };
};
