import { useState, useEffect, useCallback } from 'react';
import { Thought } from '@/contexts/types';
import { syndicateDB } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export const useThoughts = (hideChatHistory: boolean) => {
  const [currentThoughts, setCurrentThoughts] = useState<Thought[]>([]); // Visible on homepage
  const [historyThoughts, setHistoryThoughts] = useState<Thought[]>([]); // For history page
  const [clearedSession, setClearedSession] = useState<boolean>(false); // Track if session was cleared
  const { toast } = useToast();
  
  // Track recently added thoughts to prevent duplicates - using closure
  const recentlyAddedThoughts: {timestamp: string, input: string}[] = [];

  // Load thoughts from database, separating current from history
  useEffect(() => {
    const loadThoughts = async () => {
      try {
        // Load all thoughts from the database
        const loadedThoughts = await syndicateDB.getAllThoughts();
        console.log("useThoughts: Loaded all thoughts:", loadedThoughts.length);
        
        // Store all thoughts for the history page
        setHistoryThoughts(loadedThoughts);
        
        // For the main view, respect the hideChatHistory setting
        if (hideChatHistory) {
          console.log("useThoughts: Chat history hidden from main view");
          setCurrentThoughts([]); // When hideChatHistory is true, show no historical thoughts
          setClearedSession(true); // Mark that we're in a new session after clearing
        } else {
          console.log("useThoughts: Setting visible thoughts for main view");
          setCurrentThoughts(loadedThoughts);
          setClearedSession(false);
        }
      } catch (error) {
        console.error('Error loading thoughts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your thoughts from the database.',
          variant: 'destructive',
        });
      }
    };
    
    loadThoughts();
  }, [toast, hideChatHistory]);

  // Wrap addThought in useCallback
  const addThought = useCallback((thought: Thought) => {
    console.log("useThoughts: Adding new thought", { 
      hideChatHistory, 
      clearedSession,
      thoughtTimestamp: thought.timestamp,
      input: thought.input.substring(0, 20) + "..."
    });
    
    // Enhanced duplicate detection with multiple strategies
    const isDuplicate = (thoughts: Thought[], newThought: Thought) => {
      // Strategy 1: Look for exact timestamp match
      const exactDuplicate = thoughts.some(t => t.timestamp === newThought.timestamp);
      if (exactDuplicate) {
        console.log("useThoughts: Found exact timestamp duplicate");
        return true;
      }
      
      // Strategy 2: Check our recently added thoughts in memory
      const recentlyAdded = recentlyAddedThoughts.some(
        recent => recent.input.trim() === newThought.input.trim() && 
                 Math.abs(new Date(recent.timestamp).getTime() - new Date(newThought.timestamp).getTime()) < 3000
      );
      if (recentlyAdded) {
        console.log("useThoughts: Found duplicate in recently added cache");
        return true;
      }
      
      // Strategy 3: Check for content + close timestamp
      const thoughtTime = new Date(newThought.timestamp).getTime();
      
      const recentDuplicate = thoughts.some(t => {
        const timeMatch = Math.abs(new Date(t.timestamp).getTime() - thoughtTime) < 3000;
        const contentMatch = t.input?.trim() === newThought.input?.trim();
        
        if (timeMatch && contentMatch) {
          console.log("useThoughts: Found content+time duplicate");
          return true;
        }
        
        return false;
      });
      
      return recentDuplicate;
    };
    
    console.log(`[DEBUG] addThought: Before check - CurrentThoughts (length ${currentThoughts.length}) Timestamps: ${currentThoughts.map(t => t.timestamp).join(', ')}`);
    console.log(`[DEBUG] addThought: Before check - HistoryThoughts (length ${historyThoughts.length})`);
    console.log(`[DEBUG] addThought: Before check - Incoming Thought Timestamp: ${thought.timestamp}, Input: ${thought.input.substring(0, 30)}...`);

    const isDuplicateInHistory = isDuplicate(historyThoughts, thought);
    const isDuplicateInCurrent = isDuplicate(currentThoughts, thought);
    
    console.log(`[DEBUG] addThought: After check - isDuplicateInHistory=${isDuplicateInHistory}, isDuplicateInCurrent=${isDuplicateInCurrent}`);
    
    if (!isDuplicateInHistory && !isDuplicateInCurrent) {
      recentlyAddedThoughts.push({ timestamp: thought.timestamp, input: thought.input });
      if (recentlyAddedThoughts.length > 10) recentlyAddedThoughts.shift();
    }
    
    if (!isDuplicateInHistory) {
      setHistoryThoughts(prev => [...prev, thought]);
    } else {
      console.log("useThoughts: Skipping duplicate thought in history", { input: thought.input.substring(0, 20) + "..." });
    }
    
    if (!isDuplicateInCurrent) {
      if (clearedSession) {
        setCurrentThoughts(prev => [...prev, thought]);
      } else {
        setCurrentThoughts(prev => [...prev, thought]);
      }
    } else {
      console.log("useThoughts: Skipping duplicate thought in current view", { input: thought.input.substring(0, 20) + "..." });
    }
  // Corrected dependencies: removed recentlyAddedThoughts as it's a local closure variable, not state or prop
  }, [clearedSession, currentThoughts, historyThoughts, hideChatHistory]);

  // Wrap updateThought in useCallback
  const updateThought = useCallback((updatedThought: Thought) => {
    console.log(`[DEBUG] updateThought received: Timestamp=${updatedThought.timestamp}, Input="${updatedThought.input?.substring(0, 20)}...", Output="${updatedThought.output?.substring(0, 20)}..."`);

    setCurrentThoughts((prev) => {
      const updated = [...prev];
      const history = [...historyThoughts];
      let matchFound = false;

      // Log the current thoughts we're searching through
      console.log(`[DEBUG] updateThought: Checking currentThoughts (length ${updated.length}). Timestamps: ${updated.map(t => t.timestamp).join(', ')}`);
      
      // Try exact timestamp match first in currentThoughts
      const exactMatchIndex = updated.findIndex(t => t.timestamp === updatedThought.timestamp);
      if (exactMatchIndex !== -1) {
        console.log(`[DEBUG] updateThought: Exact match found in currentThoughts at index ${exactMatchIndex}`);
        updated[exactMatchIndex] = updatedThought;
        matchFound = true;
      } else {
        // Try exact timestamp match in historyThoughts
        const historyExactMatchIndex = history.findIndex(t => t.timestamp === updatedThought.timestamp);
        if (historyExactMatchIndex !== -1) {
          console.log(`[DEBUG] updateThought: Exact match found in historyThoughts at index ${historyExactMatchIndex}`);
          history[historyExactMatchIndex] = updatedThought;
          matchFound = true;
        } else {
          // If exact match fails, try approximate match (within 5ms)
          console.log(`[DEBUG] updateThought: No exact match found, trying approximate match`);
          
          // Try currentThoughts with tolerance
          for (let i = 0; i < updated.length; i++) {
            const origTime = new Date(updated[i].timestamp).getTime();
            const newTime = new Date(updatedThought.timestamp).getTime();
            const timeDiff = Math.abs(origTime - newTime);
            
            console.log(`[DEBUG] updateThought: Comparing timestamps ${updated[i].timestamp} vs ${updatedThought.timestamp}, diff=${timeDiff}ms`);
            
            // Match if timestamps are within 5ms AND input matches (if both have input)
            if (timeDiff <= 5 && 
                (!updated[i].input || !updatedThought.input || 
                 updated[i].input.trim() === updatedThought.input.trim())) {
              console.log(`[DEBUG] updateThought: Approximate match found in currentThoughts at index ${i}`);
              updated[i] = { 
                ...updatedThought,
                timestamp: updated[i].timestamp // Keep the original timestamp to prevent future mismatches
              };
              matchFound = true;
              break;
            }
          }
          
          // If still no match, try historyThoughts with tolerance
          if (!matchFound) {
            for (let i = 0; i < history.length; i++) {
              const origTime = new Date(history[i].timestamp).getTime();
              const newTime = new Date(updatedThought.timestamp).getTime();
              const timeDiff = Math.abs(origTime - newTime);
              
              // Match if timestamps are within 5ms AND input matches (if both have input)
              if (timeDiff <= 5 && 
                  (!history[i].input || !updatedThought.input || 
                   history[i].input.trim() === updatedThought.input.trim())) {
                console.log(`[DEBUG] updateThought: Approximate match found in historyThoughts at index ${i}`);
                history[i] = { 
                  ...updatedThought,
                  timestamp: history[i].timestamp // Keep the original timestamp
                };
                matchFound = true;
                break;
              }
            }
          }
        }
      }
      
      if (!matchFound) {
        console.log(`[DEBUG] updateThought: No match found for timestamp ${updatedThought.timestamp}`);
        // If no match was found anywhere, add as a new thought
        updated.push(updatedThought);
      }

      // Return the updated state
      setHistoryThoughts(history);
      return updated;
    });
  }, [setCurrentThoughts, setHistoryThoughts, historyThoughts]);

  // Wrap clearCurrentThoughts in useCallback
  const clearCurrentThoughts = useCallback(() => {
    console.log("useThoughts: Clearing current thoughts");
    setCurrentThoughts([]);
    setClearedSession(true); 
  }, []); // No dependencies needed here

  return {
    // For homepage display
    thoughts: currentThoughts,
    setThoughts: setCurrentThoughts,
    // For history page
    allThoughts: historyThoughts,
    // State
    clearedSession,
    // Actions
    addThought,
    updateThought,
    clearCurrentThoughts
  };
};
