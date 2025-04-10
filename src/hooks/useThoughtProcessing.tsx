import { useState, useCallback, useRef } from 'react';
import { Thought } from '@/contexts/types';
import { syndicateDB } from '@/lib/db';
import { generateAIResponse, generateSummary } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';
import { parseTagsFromInput, fixToastId, extractTagsFromContent, cleanSpeakingContent, estimateTokenCount } from '@/lib/utils';
// We don't need the SyndicateContext since it doesn't have the properties we need

// Define a reasonable token limit for the context history
const MAX_CONTEXT_TOKENS = 32000; // Increased limit significantly

// Default values for AI settings
const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_TEMPERATURE = 0.7;

export const useThoughtProcessing = (
  apiKey: string,
  addThought: (thought: Thought) => void,
  updateThought: (thought: Thought) => void,
) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [processingTimeout, setProcessingTimeout] = useState<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const processAIRequest = useCallback(async (
    userThought: Thought, 
    input: string, 
    initialTags: string[] = []
  ) => {
    console.log(`[DEBUG] processAIRequest: Processing thought with timestamp: ${userThought.timestamp}`);
    
    // Set processing state
    setIsProcessing(true);
    setIsGeneratingImage(false);
    setProcessingTimeout(false);

    try {
      // Get and use API key from context
      const currentAPIKey = apiKey || "";
      if (!currentAPIKey) {
        toast({
          title: "Error",
          description: "OpenAI API Key is required to use this feature",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Set timeout for long-running requests
      const timeoutId = setTimeout(() => {
        setProcessingTimeout(true);
      }, 10000);

      // Generate AI response - using the correct function signature
      const responseText = await generateAIResponse({
        prompt: userThought.input,
        apiKey: currentAPIKey,
        model: DEFAULT_MODEL,
        context: []
      });

      // Clear timeout
      clearTimeout(timeoutId);

      if (responseText) {
        // Create updated thought with AI response
        // Use the EXACT timestamp from the original thought
        const updatedThought: Thought = {
          ...userThought,
          output: responseText,
          tags: extractTagsFromContent(userThought.input + " " + responseText),
        };
        
        console.log(`[DEBUG] processAIRequest: Prepared updatedThought object with original timestamp: ${updatedThought.timestamp}`);
        
        // Update thought in the state
        updateThought(updatedThought);
        
        // Speech functionality is not available in this version
      }
    } catch (error) {
      console.error("Error processing AI request:", error);
      toast({
        title: "Error",
        description: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingTimeout(false);
    }
  }, [
    apiKey,
    updateThought,
    toast
  ]);

  const processInput = useCallback(async (input: string, id: string) => {
    // Create an initial thought object with a timestamp
    const timestamp = new Date().toISOString();
    const parsedInput = parseTagsFromInput(input);
    const newThought: Thought = {
      timestamp,
      input,
      output: '',
      tags: parsedInput.tags,
      summary: ''
    };

    // Add the thought to UI immediately
    console.log(`[DEBUG] processInput: Adding initial thought with timestamp: ${timestamp}`);
    addThought(newThought);
    
    if (input.startsWith('/')) {
      // Handle command separately - will be processed elsewhere
      return;
    }
    
    // Process as a regular thought with AI
    // Pass the newThought object directly - no need to pass timestamp separately
    await processAIRequest(newThought, parsedInput.cleanedInput, parsedInput.tags);
  }, [addThought, processAIRequest]);

  return { 
    processInput, 
    isProcessing,
    isGeneratingImage,
    processingTimeout 
  };
};
