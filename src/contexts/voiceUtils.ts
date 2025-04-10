
import { convertSpeechToText } from '@/lib/ai';
import { useToast } from '@/hooks/use-toast';

// Define the type here instead of importing it
interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

type ToastType = ReturnType<typeof useToast>;

export const setupVoiceRecording = (
  toastObj: ToastType
) => {
  let mediaRecorderRef: MediaRecorder | null = null;
  let audioChunksRef: Blob[] = [];

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.addEventListener('dataavailable', (event) => {
        console.log('Data available from recorder', event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });
      
      recorder.start();
      mediaRecorderRef = recorder;
      audioChunksRef = chunks;
      
      toastObj.toast({
        title: "Recording started",
        description: "Speak clearly and I'll convert your speech to text",
      });

      console.log('Recording started successfully');
      return 'recording';
    } catch (error) {
      console.error('Error starting recording:', error);
      toastObj.toast({
        title: 'Recording Error',
        description: 'Could not access your microphone. Please check permissions.',
        variant: 'destructive',
      });
      return 'inactive';
    }
  };

  const stopRecording = async (
    apiKey: string, 
    handleInput: (input: string) => Promise<void>
  ): Promise<'inactive' | 'processing'> => {
    console.log('Stopping recording...');
    if (!mediaRecorderRef) {
      console.error('No media recorder reference found');
      return 'inactive';
    }
    
    return new Promise<'inactive' | 'processing'>((resolve) => {
      mediaRecorderRef.addEventListener('stop', async () => {
        try {
          console.log('Recorder stopped, processing audio...');
          if (!apiKey) {
            toastObj.toast({
              title: 'API Key Required',
              description: 'Please enter your OpenAI API key to use speech-to-text',
              variant: 'destructive',
            });
            resolve('inactive');
            return;
          }
          
          console.log('Creating audio blob from chunks:', audioChunksRef.length);
          const audioBlob = new Blob(audioChunksRef, { type: 'audio/webm' });
          console.log('Audio blob created, size:', audioBlob.size);
          
          if (audioBlob.size <= 0) {
            toastObj.toast({
              title: 'Recording Error',
              description: 'No audio was recorded. Please try again.',
              variant: 'destructive',
            });
            resolve('inactive');
            return;
          }
          
          mediaRecorderRef.stream.getTracks().forEach(track => track.stop());
          
          console.log('Converting speech to text...');
          const transcription = await convertSpeechToText({
            audioBlob,
            apiKey
          });
          
          console.log('Transcription received:', transcription);
          await handleInput(transcription);
          
          resolve('inactive');
        } catch (error) {
          console.error('Error processing voice recording:', error);
          toastObj.toast({
            title: 'Speech Recognition Error',
            description: error instanceof Error ? error.message : 'Failed to process your speech',
            variant: 'destructive',
          });
          resolve('inactive');
        }
      });
      
      console.log('Stopping media recorder...');
      mediaRecorderRef.stop();
      resolve('processing');
    });
  };

  const handleVoiceInput = async (
    audioBlob: Blob,
    apiKey: string,
    handleInput: (input: string) => Promise<void>
  ) => {
    try {
      console.log('Processing voice input, blob size:', audioBlob.size);
      if (!apiKey) {
        toastObj.toast({
          title: 'API Key Required',
          description: 'Please enter your OpenAI API key to use speech-to-text',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Converting speech to text directly...');
      const transcription = await convertSpeechToText({
        audioBlob,
        apiKey
      });
      
      console.log('Direct transcription received:', transcription);
      await handleInput(transcription);
    } catch (error) {
      console.error('Error processing voice input:', error);
      toastObj.toast({
        title: 'Speech Recognition Error',
        description: error instanceof Error ? error.message : 'Failed to process your speech',
        variant: 'destructive',
      });
    }
  };

  return {
    startRecording,
    stopRecording,
    handleVoiceInput
  };
};
