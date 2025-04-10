import { useCallback } from 'react';
import { Thought } from '@/contexts/types';
import { extractCommandFromInput, parseTagsFromInput } from '@/lib/utils';
import { createCommandProcessor } from '@/contexts/commandProcessor';
import { syndicateDB } from '@/lib/db';

export const useInputHandling = (
  apiKey: string,
  addToHistory: (input: string) => void,
  setIsProcessing: (isProcessing: boolean) => void,
  processAIRequest: (userThought: Thought, cleanedInput: string, inputTags: string[], originalTimestamp: string) => Promise<void>,
  addThought: (thought: Thought) => void,
  updateThought: (thought: Thought) => void,
  setHideChatHistory: (hide: boolean) => void,
  hideChatHistory: boolean,
  clearedSession: boolean
) => {
  const { processCommand } = createCommandProcessor(apiKey);

  const handleCommandInput = useCallback(async (
    command: string, 
    content: string, 
    userThought: Thought
  ) => {
    try {
      // Check DB history before processing
      const dbHistory = await syndicateDB.getAllThoughts();
      console.log(`handleCommandInput: Found ${dbHistory.length} thoughts in database before processing command`);
      
      const response = await processCommand(command, content);
      
      const newThought: Thought = {
        ...userThought,
        output: response,
        tags: [command],
        summary: `Used the /${command} command`
      };
      
      await syndicateDB.saveThought(newThought);
      
      updateThought(newThought);
      console.log("handleCommandInput: Updated thought with command response", { command });
      return true;
    } catch (error) {
      console.error('Error processing command:', error);
      return false;
    }
  }, [processCommand, updateThought]);

  const handleInput = useCallback(async (input: string) => {
    setIsProcessing(true);
    try {
      console.log("handleInput: Processing input", { input, hideChatHistory });
      
      // Check if input is a command and handle it
      if (input.startsWith('/')) {
        const { command, content } = extractCommandFromInput(input);
        // Add to history first
        addToHistory(input);
        
        // Create a new thought for the command
        const timestamp = new Date().toISOString();
        const userThought = {
          timestamp,
          input,
          output: '',
          tags: [command],
          summary: `/${command} command`,
          hideChatHistory,
          clearedSession
        };
        
        // Add the thought and handle command
        addThought(userThought);
        await handleCommandInput(command, content, userThought);
        setIsProcessing(false);
        return;
      }
      
      // For regular messages, parse tags and clean input
      const { cleanedInput, tags: inputTags } = parseTagsFromInput(input);
      
      // Check DB history before processing
      const dbHistory = await syndicateDB.getAllThoughts();
      console.log(`handleInput: Found ${dbHistory.length} thoughts in database before processing request`);
      
      // Create timestamp for this conversation entry - will be shared across both thoughts
      const timestamp = new Date().toISOString();
      
      // Create initial user thought for immediate UI feedback
      const userThought = {
        timestamp,
        input,
        output: '',
        tags: inputTags,
        summary: '',
        hideChatHistory,
        clearedSession
      };
      
      // Add the user input thought to the UI right away
      addThought(userThought);
      console.log(`handleInput: Added initial thought`, { timestamp, hideChatHistory });
      
      // Add to command history
      addToHistory(input);
      
      // Send the request to the AI processor without creating an additional entry
      console.log(`handleInput: Sending to processAIRequest`, { cleanedInput, inputTags, dbHistoryLength: dbHistory.length });
      
      // Process the AIRequest using the same thought object - prevent duplicate creation
      await processAIRequest(userThought, cleanedInput, inputTags, timestamp);
      
    } catch (error) {
      console.error("Error in handleInput:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [hideChatHistory, clearedSession, handleCommandInput, addToHistory, processAIRequest, addThought]);

  return {
    handleInput,
    processCommand
  };
};
