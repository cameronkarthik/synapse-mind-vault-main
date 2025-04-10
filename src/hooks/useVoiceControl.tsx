
import { useCallback } from 'react';
import { setupVoiceRecording } from '@/contexts/voiceUtils';
import { useToast } from '@/hooks/use-toast';

export const useVoiceControl = (
  apiKey: string,
  handleInput: (input: string) => Promise<void>,
  recordingState: 'inactive' | 'recording' | 'processing',
  setRecordingState: React.Dispatch<React.SetStateAction<'inactive' | 'recording' | 'processing'>>
) => {
  const toastObj = useToast();
  const voiceUtils = setupVoiceRecording(toastObj);

  const startRecording = useCallback(async () => {
    const newState = await voiceUtils.startRecording();
    setRecordingState(newState);
  }, [voiceUtils, setRecordingState]);

  const stopRecording = useCallback(async () => {
    if (recordingState !== 'recording') return;
    
    const newState = await voiceUtils.stopRecording(apiKey, handleInput);
    setRecordingState(newState);
  }, [apiKey, handleInput, recordingState, voiceUtils, setRecordingState]);

  const handleVoiceInput = useCallback(async (audioBlob: Blob) => {
    try {
      await voiceUtils.handleVoiceInput(audioBlob, apiKey, handleInput);
    } catch (error) {
      console.error('Error with voice input:', error);
      toastObj.toast({
        title: 'Voice Error',
        description: error instanceof Error ? error.message : 'Error processing voice input',
        variant: 'destructive',
      });
    }
  }, [apiKey, handleInput, voiceUtils, toastObj]);

  return {
    startRecording,
    stopRecording,
    handleVoiceInput
  };
};
