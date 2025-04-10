
import { useState, useEffect, useCallback } from 'react';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('syndicate-openai-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('syndicate-openai-key', apiKey);
    }
  }, [apiKey]);

  const updateApiKey = useCallback((key: string) => {
    setApiKey(key);
  }, []);

  return {
    apiKey,
    setApiKey: updateApiKey
  };
};
