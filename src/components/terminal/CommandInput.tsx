import React, { useState, useRef } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { Button } from '@/components/ui/button';
import { FileText, Image, SendHorizontal } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CommandInput: React.FC = () => {
  const [input, setInput] = useState<string>('');
  const { handleInput, isProcessing, apiKey } = useSyndicate();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size
  const MAX_TEXT_FILE_SIZE = 5 * 1024 * 1024; // 5MB max file size
  
  const [isImportingFile, setIsImportingFile] = useState(false);
  const [fileImportProgress, setFileImportProgress] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      handleInput(input);
      setInput('');
    }
  };

  const handleTextFileClick = () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenAI API Key is required for text file analysis",
        variant: "destructive",
      });
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleTextFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!apiKey) {
        toast({
          title: "Error",
          description: "OpenAI API Key is required for text file analysis",
          variant: "destructive",
        });
        return;
      }

      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      
      // Check file size
      if (file.size > MAX_TEXT_FILE_SIZE) {
        toast({
          title: "Error",
          description: `File size exceeds the maximum limit of ${MAX_TEXT_FILE_SIZE / (1024 * 1024)}MB`,
          variant: "destructive",
        });
        return;
      }
      
      setIsImportingFile(true);
      setFileImportProgress(0);
      
      // Simulate progress (in a real app, this would be based on actual file reading progress)
      const progressInterval = setInterval(() => {
        setFileImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = async (event) => {
        clearInterval(progressInterval);
        setFileImportProgress(100);
        
        if (event.target && typeof event.target.result === 'string') {
          const content = event.target.result;
          
          // Here you would normally process the file content
          // For example, send it to your API or add it to the input
          handleInput(`/analyze ${file.name}\n\n${content}`);
          
          setIsImportingFile(false);
          setFileImportProgress(0);
        }
      };
      
      reader.onerror = () => {
        clearInterval(progressInterval);
        setIsImportingFile(false);
        setFileImportProgress(0);
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
      };
      
      reader.readAsText(file);
    } catch (error) {
      setIsImportingFile(false);
      setFileImportProgress(0);
      toast({
        title: "Error",
        description: `Failed to process text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageFileClick = () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenAI API Key is required for image analysis",
        variant: "destructive",
      });
      return;
    }
    
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!apiKey) {
        toast({
          title: "Error",
          description: "OpenAI API Key is required for image analysis",
          variant: "destructive",
        });
        return;
      }

      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      
      // Check file size
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        toast({
          title: "Error",
          description: `File size exceeds the maximum limit of ${MAX_IMAGE_FILE_SIZE / (1024 * 1024)}MB`,
          variant: "destructive",
        });
        return;
      }
      
      setIsImportingFile(true);
      setFileImportProgress(0);
      
      // Simulate progress (in a real app, this would be based on actual file reading progress)
      const progressInterval = setInterval(() => {
        setFileImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      // Read file content as data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        clearInterval(progressInterval);
        setFileImportProgress(100);
        
        if (event.target && typeof event.target.result === 'string') {
          const dataUrl = event.target.result;
          
          // Process the image using the appropriate command
          handleInput(`/analyze-image ${file.name}\n\n${dataUrl}`);
          
          setIsImportingFile(false);
          setFileImportProgress(0);
        }
      };
      
      reader.onerror = () => {
        clearInterval(progressInterval);
        setIsImportingFile(false);
        setFileImportProgress(0);
        toast({
          title: "Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setIsImportingFile(false);
      setFileImportProgress(0);
      toast({
        title: "Error",
        description: `Failed to process image file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="flex items-center gap-2 border border-input p-2 rounded-md bg-background"
    >
      <div className="flex-1 relative">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command or message..."
          className="w-full pl-6 pr-2 py-2 bg-transparent border-none focus:outline-none"
          disabled={isProcessing || isImportingFile}
        />
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleTextFile}
        accept=".txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.html,.css"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFile}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {isImportingFile ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">{fileImportProgress}%</span>
        </div>
      ) : (
        <>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={handleTextFileClick}
            disabled={isProcessing}
            title="Import text file"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={handleImageFileClick}
            disabled={isProcessing}
            title="Import image file"
          >
            <Image className="h-4 w-4" />
          </Button>
        </>
      )}

      <Button 
        type="submit" 
        variant="ghost" 
        size="icon" 
        disabled={!input.trim() || isProcessing || isImportingFile}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SendHorizontal className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};

export default CommandInput; 