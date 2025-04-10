
import { useState, useEffect, useCallback } from 'react';

export const useCommandHistory = () => {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  
  // Load command history from localStorage on initial load
  useEffect(() => {
    const savedCommandHistory = localStorage.getItem('syndicate-command-history');
    if (savedCommandHistory) {
      try {
        const parsedHistory = JSON.parse(savedCommandHistory);
        if (Array.isArray(parsedHistory)) {
          setCommandHistory(parsedHistory);
        }
      } catch (error) {
        console.error('Error parsing command history:', error);
      }
    }
  }, []);

  // Save command history to localStorage when it changes
  useEffect(() => {
    if (commandHistory.length > 0) {
      const limitedHistory = commandHistory.slice(-100);
      localStorage.setItem('syndicate-command-history', JSON.stringify(limitedHistory));
    }
  }, [commandHistory]);

  const addToHistory = useCallback((input: string) => {
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);
  }, []);

  return {
    commandHistory,
    historyIndex,
    setHistoryIndex,
    addToHistory
  };
};
