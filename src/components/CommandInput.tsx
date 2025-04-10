import React, { useState, useRef, useEffect } from 'react';
import { Loader2, FileText, Image } from 'lucide-react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { Button } from '@/components/ui/button';
import { getRandomGreeting } from '@/lib/utils';
import { parseImportedFile } from '@/lib/fileImport';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { syndicateDB } from '@/lib/db';
import { Thought } from '@/contexts/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

// Processing progress component with requestAnimationFrame for smoother animation
const ProcessingProgress = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();
    
    // Function to animate the progress bar using requestAnimationFrame
    const animateProgress = (timestamp: number) => {
      // Calculate time delta to ensure smooth animation regardless of frame rate
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      
      // Only update state when there's a noticeable change (reduce renders)
      setProgress((prevProgress) => {
        // Move faster at first, then slow down as we approach 95%
        // Adjust speed based on time delta for consistent animation
        const increment = delta * 0.05 * (95 - prevProgress) / 100;
        const nextProgress = prevProgress + increment;
        
        // Round to one decimal place to reduce unnecessary updates
        return Math.min(Math.round(nextProgress * 10) / 10, 95);
      });
      
      // Continue animation
      animationFrameId = requestAnimationFrame(animateProgress);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(animateProgress);
    
    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);
  
  // Use transform instead of width changes to reduce layout shifts
  return (
    <div className="h-2 w-full bg-zinc-800 rounded overflow-hidden">
      <div 
        className="h-full bg-blue-500 rounded transition-transform"
        style={{ 
          transform: `translateX(${progress - 100}%)`,
          width: '100%'
        }}
      />
    </div>
  );
};

// Add this ProgressBar component after the ProcessingProgress component
const ProgressBar = ({ value }: { value: number }) => {
  // Use transform instead of width changes to reduce layout shifts
  return (
    <div className="h-2 w-full bg-zinc-800 rounded overflow-hidden">
      <div 
        className="h-full bg-blue-500 rounded transition-transform"
        style={{ 
          transform: `translateX(${value - 100}%)`,
          width: '100%'
        }}
      />
    </div>
  );
};

// List of available commands for auto-completion
const AVAILABLE_COMMANDS = [
  '/help',
  '/recall',
  '/summarize',
  '/tag',
  '/journal',
  '/note',
  '/import'
];

// Supported file types matching OpenAI's API
const SUPPORTED_TEXT_TYPES = ['txt', 'json', 'csv', 'pdf', 'md'];
const SUPPORTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const SUPPORTED_FILE_TYPES = [...SUPPORTED_TEXT_TYPES, ...SUPPORTED_IMAGE_TYPES];

// File size limit matching OpenAI's practical limit (100MB for text, 20MB for images)
const MAX_TEXT_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Add this helper function before the component
const analyzeImage = async (imageData: string, apiKey: string): Promise<string | null> => {
  try {
    const base64Content = imageData.split(",")[1]; // Remove data URL prefix
    
    // Prepare request
    const requestBody = JSON.stringify({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text", 
              text: "Analyze this image and describe what you see in detail."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Content}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    // Make API request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: requestBody
    });
    
    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
      
      // Try to parse detailed error from response
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
        }
      } catch (parseError) {
        // If we can't parse JSON, use the original error
        console.error("Error parsing API error response:", parseError);
      }
      
      throw new Error(errorMessage);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Validate response format
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Invalid response format from OpenAI API");
    }
    
    // Return the content
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

// Add this function before handleImageFile
// Helper function to analyze image with OpenAI
const analyzeImageWithOpenAI = async (file: File, apiKey: string) => {
  // Read the file
  const imageData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      if (!e.target || !e.target.result) {
        reject(new Error("Failed to read image file"));
        return;
      }
      resolve(e.target.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Error reading image file"));
    };
    reader.readAsDataURL(file);
  });
  
  // Process the image with OpenAI
  const analysisResult = await analyzeImage(imageData, apiKey);
  
  if (!analysisResult) {
    throw new Error("No analysis result returned");
  }
  
  // Create a nicely formatted title
  const analysisTitle = `Analysis of ${file.name}`;
  
  return { analysisTitle, analysisResult };
};

const CommandInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [placeholder, setPlaceholder] = useState('Type a command or message...');
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDialogType, setFileDialogType] = useState<'text' | 'image'>('text');
  const [additionalContext, setAdditionalContext] = useState('');
  
  // Refs for file inputs
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Database ref to avoid excessive re-renders
  const dbRef = useRef<any>(null);
  const contextInitializedRef = useRef(false);
  
  const { toast } = useToast();
  const [contextError, setContextError] = useState<string | null>(null);
  
  // Call useSyndicate at the top level
  const syndicateContext = useSyndicate();
  
  // Wrap context validation in a try/catch block 
  try {
    // Immediately validate critical context properties
    if (!syndicateContext) {
      throw new Error("SyndicateContext is undefined");
    }
    // Set initialization ref if context is valid
    contextInitializedRef.current = true; 
  } catch (error) {
    console.error("Failed to initialize SyndicateContext:", error);
    // Store the error to display in the UI if needed
    // Use useEffect to prevent setting state during render
    // useEffect(() => {
    //   setContextError(error instanceof Error ? error.message : "Failed to initialize application context");
    // }, [error]); 
    // ^^^ Commenting out direct state setting here - error boundary should handle this.
    // Re-throw the error if needed for the error boundary
    // throw error;
  }

  // Safely extract context with fallbacks, now that syndicateContext is defined unconditionally
  const { 
    handleInput = async () => {
      console.error("handleInput not available");
      toast?.({ title: "Error", description: "Application context error", variant: "destructive" });
    }, 
    isProcessing: contextIsProcessing = false, 
    commandHistory: contextCommandHistory = [], 
    historyIndex: contextHistoryIndex = -1, 
    setHistoryIndex: setContextHistoryIndex = () => {},
    apiKey = '',
    syndicateDB = null,
    addThought: contextAddThought, 
    updateThought: contextUpdateThought
  } = syndicateContext || {}; // Fallback still useful if context is somehow null despite check

  // Create a local reference to ensure DB is available
  const dbRefLocal = useRef(syndicateDB);
  
  // Update getDatabase to better debug and handle the database
  const getDatabase = async (maxRetries = 3, delay = 300) => {
    let retries = 0;
    
    console.log("Database access attempt - Starting with refs:", {
      contextDB: !!syndicateContext?.syndicateDB,
      localRef: !!dbRefLocal.current,
      importedDB: typeof syndicateDB !== 'undefined',
      windowDB: !!(window as any).syndicateDB
    });
    
    while (retries < maxRetries) {
      // Try context first (should be most reliable)
      if (syndicateContext?.syndicateDB) {
        console.log("Using database from context");
        return syndicateContext.syndicateDB;
      }
      
      // Then try our ref
      if (dbRefLocal.current) {
        console.log("Using database from local ref");
        return dbRefLocal.current;
      }
      
      // Then global window object
      if ((window as any).syndicateDB) {
        console.log("Using database from window object");
        return (window as any).syndicateDB;
      }
      
      // Finally imported module
      if (syndicateDB) {
        console.log("Using database from direct import");
        // Store in window for future use
        (window as any).syndicateDB = syndicateDB;
        return syndicateDB;
      }
      
      // Forcefully try to initialize the database if nothing works
      if (retries === maxRetries - 1) {
        try {
          console.log("Attempting to force initialize the database");
          // Check if we have access to the IndexedDB API
          if (typeof indexedDB !== 'undefined') {
            // Add console debug info
            console.log("IndexedDB available, opening database");
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
              const request = indexedDB.open('syndicate-mind-vault', 1);
              
              request.onupgradeneeded = (event) => {
                console.log("Database upgrade needed");
                const db = (event.target as IDBOpenDBRequest).result;
                
                // Create thoughts table if it doesn't exist
                if (!db.objectStoreNames.contains('thoughts')) {
                  console.log("Creating thoughts store");
                  const thoughtsStore = db.createObjectStore('thoughts', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                  });
                  
                  // Create indexes for searching
                  thoughtsStore.createIndex('timestamp', 'timestamp', { unique: false });
                  thoughtsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                }
              };
              
              request.onsuccess = (event) => {
                console.log("Database opened successfully");
                resolve((event.target as IDBOpenDBRequest).result);
              };
              
              request.onerror = (event) => {
                console.error("Error opening database:", (event.target as IDBOpenDBRequest).error);
                reject((event.target as IDBOpenDBRequest).error);
              };
            });
            
            console.log("Database initialized from scratch");
            
            // Create a minimal DB object that supports the saveThought method
            const minimalDB = {
              db,
              saveThought: async (thought: any) => {
                console.log("Using minimal DB implementation to save thought");
                return new Promise((resolve, reject) => {
                  const transaction = db.transaction(['thoughts'], 'readwrite');
                  const store = transaction.objectStore('thoughts');
                  
                  const request = store.add(thought);
                  
                  request.onsuccess = () => {
                    resolve(request.result as number);
                  };
                  
                  request.onerror = () => {
                    reject(request.error);
                  };
                });
              }
            };
            
            // Update all references
            (window as any).syndicateDB = minimalDB;
            dbRefLocal.current = minimalDB;
            
            // Check for private browsing mode or permission issues
            try {
              // Test if IndexedDB is fully functional
              const testDB = indexedDB.open("test-db-permissions", 1);
              
              testDB.onerror = (event) => {
                const error = (event.target as IDBOpenDBRequest).error;
                console.error("IndexedDB permission test failed:", error);
                
                if (error && (
                  error.name === 'SecurityError' || 
                  error.name === 'InvalidStateError' || 
                  (error.message && error.message.includes('quota'))
                )) {
                  console.error("Detected potential private browsing mode or IndexedDB permission issues");
                  
                  // Show a clear message to the user
                  toast({
                    title: "Storage Permission Issue",
                    description: "Your browser seems to be blocking database access. This may happen in private browsing mode or if you've disabled website data storage. Image analysis results won't be saved.",
                    variant: "destructive"
                  });
                }
              };
              
              testDB.onsuccess = () => {
                console.log("IndexedDB permission test successful");
                testDB.result.close();
                // Clean up test database
                indexedDB.deleteDatabase("test-db-permissions");
              };
            } catch (permissionTestError) {
              console.error("Error while testing IndexedDB permissions:", permissionTestError);
            }
            
            return minimalDB;
          } else {
            console.error("IndexedDB API not available in this browser");
          }
        } catch (error) {
          console.error("Error during forced database initialization:", error);
        }
      }
      
      // Log the retry attempt
      console.log(`Retry attempt ${retries + 1}/${maxRetries} to access database...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
    
    console.error("Failed to access database after multiple attempts - Error details:", {
      contextAvailable: !!syndicateContext,
      contextDbAvailable: !!(syndicateContext?.syndicateDB),
      browserIndexedDBAvailable: typeof indexedDB !== 'undefined',
      importedDbAvailable: !!syndicateDB
    });
    
    // Return null if all attempts fail
    return null;
  };

  // Modify the useEffect for context initialization to reduce logging
  useEffect(() => {
    if (syndicateContext) {
      contextInitializedRef.current = true;
      
      // Log only when in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log("SyndicateContext initialized");
      }
      
      // The addThought function isn't directly exposed in the context type
      // So we won't try to store it as a ref, we'll use handleInput instead
      
      // Update the dbRef if it's available in context
      if (syndicateContext.syndicateDB) {
        dbRefLocal.current = syndicateContext.syndicateDB;
        
        // Also store in window for emergency access
        (window as any).syndicateDB = syndicateContext.syndicateDB;
      } else {
        // If not in context, try to initialize from imported module
        if (syndicateDB) {
          dbRefLocal.current = syndicateDB;
          (window as any).syndicateDB = syndicateDB;
        }
      }
      
      // Asynchronously verify database is fully functional without causing UI updates
      if (!dbRefLocal.current) {
        // Use requestIdleCallback to avoid affecting UI performance
        const checkDatabase = () => {
          getDatabase().then(db => {
            if (db) {
              dbRefLocal.current = db;
            }
          }).catch(() => {
            // Silent catch - we don't want to log errors during idle callbacks
          });
        };
        
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(checkDatabase, { timeout: 2000 });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(checkDatabase, 1000);
        }
      }
    }
  }, [syndicateContext]);

  // Add a ref to track last processing state
  const lastProcessingStateRef = useRef(false);

  // Show error toast if context is missing
  useEffect(() => {
    if (contextError) {
      toast({
        title: "Application Error",
        description: "There was a problem loading the application. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [contextError, toast]);

  // Test DB access on component mount
  useEffect(() => {
    if (!syndicateDB) {
      console.error("Database access not available");
    }
  }, [syndicateDB]);

  useEffect(() => {
    // Focus input field on component mount and set a stable placeholder
    if (inputRef.current) {
      inputRef.current.focus();
      // Only set the placeholder once when the component mounts
      setPlaceholder(getRandomGreeting());
    }
  }, []);

  useEffect(() => {
    // Update input when navigating command history
    if (contextHistoryIndex >= 0 && contextCommandHistory[contextCommandHistory.length - 1 - contextHistoryIndex]) {
      setInput(contextCommandHistory[contextCommandHistory.length - 1 - contextHistoryIndex]);
    }
  }, [contextHistoryIndex, contextCommandHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with input:", input);
    if (!input.trim() || contextIsProcessing || isImporting) return;

    try {
      setIsImporting(true);
      // Also ensure progress indicators are reset before starting
      setIsProcessing(false);
      setImportProgress(0);

    console.log("Processing input:", input);
    await handleInput(input);
    setInput('');
    } finally {
      setIsImporting(false);
    }
  };

  const autocompleteCommand = () => {
    // Only try to autocomplete if input starts with / (command prefix)
    if (input.startsWith('/')) {
      const matchingCommands = AVAILABLE_COMMANDS.filter(cmd => 
        cmd.startsWith(input) && cmd.length > input.length
      );

      if (matchingCommands.length === 1) {
        // If there's exactly one match, use it
        setInput(matchingCommands[0] + ' ');
      } else if (matchingCommands.length > 1) {
        // Find the longest common prefix among matching commands
        const firstCmd = matchingCommands[0];
        let commonPrefix = input;
        
        for (let i = input.length; i < firstCmd.length; i++) {
          const nextChar = firstCmd.charAt(i);
          const allHaveSameChar = matchingCommands.every(cmd => 
            cmd.length > i && cmd.charAt(i) === nextChar
          );
          
          if (allHaveSameChar) {
            commonPrefix += nextChar;
          } else {
            break;
          }
        }
        
        if (commonPrefix.length > input.length) {
          setInput(commonPrefix);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Command history navigation with up/down arrows
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (contextHistoryIndex < contextCommandHistory.length - 1) {
        setContextHistoryIndex(contextHistoryIndex + 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (contextHistoryIndex > 0) {
        setContextHistoryIndex(contextHistoryIndex - 1);
      } else if (contextHistoryIndex === 0) {
        setContextHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      // Tab key for command auto-completion
      e.preventDefault();
      autocompleteCommand();
    }
  };

  const handleTextFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageFileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      console.log("[DEBUG] Image file button clicked");
      
      if (!apiKey) {
        console.log("[DEBUG] No API key available - cannot process image");
        toast({
          title: "OpenAI API Key Required",
          description: "Please add your API key in Settings to use image analysis",
          variant: "destructive"
        });
        return;
      }
      
      // Trigger the existing image input ref
      if (imageInputRef.current) {
        console.log("[DEBUG] Triggering existing image file input");
        imageInputRef.current.click();
      } else {
        console.error("[DEBUG] Image input ref not found");
        toast({
          title: "Error",
          description: "Could not initialize image upload",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error("[DEBUG] Critical error in handleImageFileClick:", error);
      toast({
        title: "Error",
        description: "Could not initialize image upload",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      // Check if context is available early
      if (!syndicateContext) {
        console.error("[DEBUG] Context not available in handleFileChange");
        toast?.({ title: "Error", description: "Application context error. Please reload.", variant: "destructive" });
        return;
      }
      
      const file = files[0];
      console.log(`[DEBUG] handleFileChange: File selected: ${file.name}`);
      
      // Determine if this is an image file
      const fileType = file.name.split('.').pop()?.toLowerCase();
      const isImage = fileType ? SUPPORTED_IMAGE_TYPES.includes(fileType) : false;
      console.log(`[DEBUG] handleFileChange: Is image? ${isImage}`);
      
      // Check file size based on type
      const maxSize = isImage ? MAX_IMAGE_FILE_SIZE : MAX_TEXT_FILE_SIZE;
      if (file.size > maxSize) {
        console.error(`File too large: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
        toast({
          title: "Error",
          description: `File exceeds size limit (${maxSize / (1024 * 1024)}MB)`,
          variant: "destructive"
        });
        // Reset the input value so the same file can be selected again
        e.target.value = ''; 
        return;
      }

      // Check file type
      if (!fileType || !SUPPORTED_FILE_TYPES.includes(fileType)) {
        console.error(`Unsupported file type: ${fileType || 'unknown'}`);
        toast({
          title: "Error",
          description: `Unsupported file type`,
          variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      // Open dialog for file context
      setSelectedFile(file);
      setFileDialogType(isImage ? 'image' : 'text');
      setAdditionalContext('');
      setShowFileDialog(true);
      console.log("[DEBUG] handleFileChange: Showing file dialog for context");
      
    } catch (error) {
      console.error('Error selecting file:', error);
      toast?.({
        title: "File selection failed",
        description: error instanceof Error ? error.message : "Failed to select file",
        variant: "destructive"
      });
      // Reset file inputs
      e.target.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const cancelFileDialog = () => {
    setShowFileDialog(false);
    setSelectedFile(null);
    setAdditionalContext('');
    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const processSelectedFile = async () => {
    if (!selectedFile) {
      console.error("[DEBUG] processSelectedFile called but no file selected");
      return;
    }
    
    console.log("[DEBUG] Processing selected file", {
      fileName: selectedFile.name,
      fileType: fileDialogType,
      hasAdditionalContext: !!additionalContext
    });
    
    // Create a timestamp for this operation NOW
    const operationTimestamp = new Date().toISOString();
    
    try {
      debugger; // <<< Breakpoint 1: Before context check
      const contextValues = {
        contextInitialized: contextInitializedRef.current,
        hasHandleInput: !!handleInput,
        hasContextAddThought: !!contextAddThought,
        hasContextUpdateThought: !!contextUpdateThought
      };
      console.log("[DEBUG] Checking context inside processSelectedFile:", contextValues);

      if (!contextValues.contextInitialized || !contextValues.hasHandleInput || !contextValues.hasContextAddThought || !contextValues.hasContextUpdateThought) { 
        console.error("[DEBUG] React context error in processSelectedFile - one or more context values missing");
        throw new Error("React context error: Application state is not properly initialized");
      }

      debugger; // <<< Breakpoint 2: After context check (if it passes)
      setShowFileDialog(false);
      setIsImporting(true);
      setImportProgress(5); // Start progress
      
      const isImageFile = fileDialogType === 'image';
      console.log("[DEBUG] File type determined:", isImageFile ? "image" : "text");
      
      // Process the file based on type
      if (isImageFile) {
        console.log("[DEBUG] Calling handleImageFile with file:", selectedFile.name);
        // Pass renamed context functions
        await handleImageFile(selectedFile, additionalContext, operationTimestamp, contextAddThought, contextUpdateThought); 
      } else {
        // Pass timestamp to handleTextFile for consistency if needed
        await handleTextFile(selectedFile, additionalContext, operationTimestamp);
      }
    } catch (error) {
      console.error(`[DEBUG] Error processing ${fileDialogType} file:`, error);
      
      // Specifically check for React context errors
      if (error instanceof Error && 
          (error.message.includes('useContext') || 
           error.message.includes('must be used within') || 
           error.message.includes('Provider') ||
           error.message.includes('React context error'))) {
        toast({
          title: "Application Error",
          description: "There was a problem with the application state. Please reload the page and try again.",
          variant: "destructive"
        });
      } else {
        // Handle other errors
        toast({
          title: `${fileDialogType.charAt(0).toUpperCase() + fileDialogType.slice(1)} import failed`,
          description: error instanceof Error ? error.message : `Failed to process ${fileDialogType} file`,
          variant: "destructive"
        });
      }
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      setSelectedFile(null);
      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Modify handleTextFile to accept timestamp (optional for now)
  const handleTextFile = async (file: File, context: string, operationTimestamp: string) => {
    try {
      setImportProgress(10);
      const content = await parseImportedFile(file);
      if (!content) {
        throw new Error("Failed to parse file content");
      }
      
      setImportProgress(25);
      
      // Check if handleInput is available (part of context)
      if (!handleInput) {
        throw new Error("Application context is unavailable. Please reload the page and try again.");
      }
      
      // Auto-create a command with the file content and context
      const contextTag = context ? ` tag:${context.split(/\s+/)[0].replace(/[^a-z0-9]/gi, '')}` : '';
      // Use the operationTimestamp for the initial thought
      const command = `/import from:${file.name}${contextTag}`; 
      // We might need to modify handleInput to accept a timestamp override, 
      // or create the initial thought manually here using operationTimestamp.
      // For now, let handleInput generate its own timestamp, but be aware this might cause slight timing mismatches.
      await handleInput(command); 
      
      // Process the content in chunks if needed
      const MAX_CHUNK_SIZE = 2000; // Increased chunk size for better context
      
      if (content.length > MAX_CHUNK_SIZE) {
        const chunks = [];
        for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
          chunks.push(content.substring(i, i + MAX_CHUNK_SIZE));
        }
        
        // Show progress indication for large files
        if (chunks.length > 3) {
          console.log(`Processing ${chunks.length} chunks from ${file.name}`);
        }
        
        // Send the additional context first if provided
        if (context) {
          setImportProgress(30);
          await handleInput(`User context for ${file.name}:\n${context}`);
        }
        
        // Send chunks with progress updates
        for (let i = 0; i < chunks.length; i++) {
          const progressValue = 30 + Math.floor(((i + 1) / chunks.length) * 70);
          setImportProgress(progressValue);
          
          await handleInput(chunks[i]);
          
          if (i < chunks.length - 1) {
            // Wait a bit between chunks to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Final success message for chunked files
        console.log(`Import complete: processed all ${chunks.length} chunks from ${file.name}`);
      } else {
        // Send the additional context first if provided
        if (context) {
          setImportProgress(40);
          await handleInput(`User context for ${file.name}:\n${context}`);
        }
        
        // For small files, just process the whole content at once
        setImportProgress(70);
        await handleInput(content);
        setImportProgress(100);
        
        console.log(`File imported: ${file.name}`);
      }
    } catch (error) {
      console.error("Error in handleTextFile:", error);
      throw error; // Re-throw to be handled by the parent try-catch
    }
  };
  
  // Modify handleImageFile to accept addThought, updateThought, and timestamp
  const handleImageFile = async (
    file: File, 
    additionalContext: string = '',
    operationTimestamp: string, // Timestamp for the whole operation
    addThought: (thought: Thought) => void, // Use the function passed in
    updateThought: (thought: Thought) => void // Use the function passed in
  ) => {
    debugger; // <<< Breakpoint 3: Start of handleImageFile
    let thoughtIdToUpdate: string | null = operationTimestamp; // Use the timestamp as the initial ID

    try {
      setIsProcessing(true);
      
      // Check if API Key is available using the context value
      if (!apiKey) {
        toast({
          title: "Error",
          description: 'OpenAI API Key is required for image analysis',
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // 1. Create the initial "Importing..." thought
      const contextTag = additionalContext ? ` context:"${additionalContext}"` : '';
      const commandInput = `/import from:${file.name} type:image${contextTag}`;
      const initialThought: Thought = {
        timestamp: operationTimestamp, // Use the shared timestamp
        input: commandInput,
        output: "Importing and analyzing image...", // Initial status
        tags: ['import', 'image'],
        summary: `Importing ${file.name}`
      };
      addThought(initialThought);
      console.log("[DEBUG] Added initial image import thought:", operationTimestamp);
      
      // Process the image file
      setImportProgress(10); // Update progress
      
      // Get analysis from OpenAI Vision
      const { analysisTitle, analysisResult } = await analyzeImageWithOpenAI(file, apiKey);
      console.log("[DEBUG] OpenAI analysis received.");
      
      // Update progress
      setImportProgress(75);
      
      // 2. Update the thought with the analysis result
      const finalThought: Thought = {
        ...initialThought, // Use the initial thought data
        output: `${analysisTitle}

${analysisResult}`, // Combine title and result
        tags: [...(initialThought.tags || []), 'analysis'], // Add analysis tag
        summary: analysisTitle, // Update summary
      };
      
      // Update the existing thought instead of creating new ones
      updateThought(finalThought);
      console.log("[DEBUG] Updated thought with analysis result:", finalThought.timestamp);
      
      // Complete the process
      setImportProgress(100);
      setTimeout(() => setImportProgress(0), 2000); // Show completion briefly

    } catch (error) {
      console.error('Error processing image file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: 'Failed to process image file: ' + errorMessage,
        variant: "destructive",
      });
      
      // Optionally update the thought with the error message
      if (thoughtIdToUpdate) {
        const errorThought: Thought = {
          timestamp: thoughtIdToUpdate,
          input: `/import from:${file.name} type:image failed`, // Adjust input to reflect error
          output: `Error processing image: ${errorMessage}`,
          tags: ['import', 'image', 'error'],
          summary: `Error importing ${file.name}`
        };
        // Use updateThought passed from context
        try {
          updateThought(errorThought);
        } catch (updateError) {
          console.error("Failed to update thought with error:", updateError);
        }
      }
      
      setImportProgress(0);
      
    } finally {
      setIsProcessing(false); // Ensure processing state is always reset
      // Don't reset import progress here, let the setTimeout handle it
    }
  };
  
  // Replace the problematic cleanup effect with a simpler version
  useEffect(() => {
    // Only run this when processing state changes from true to false
    if (lastProcessingStateRef.current && !contextIsProcessing) {
      console.log("Processing state changed from true to false");
      
      // Single cleanup with delay
      const timer = setTimeout(() => {
        console.log("Cleanup running after processing completed");
        setImportProgress(0);
        setIsImporting(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Update the ref for next comparison
    lastProcessingStateRef.current = contextIsProcessing;
  }, [contextIsProcessing]);

  return (
    <>
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 rounded-b-md">
        {isImporting && (
          <div className="mb-3 progress-container" style={{ height: '40px' }}>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Importing {selectedFile?.name || "image"}...</span>
              <span>{Math.round(importProgress)}%</span>
            </div>
            <ProgressBar value={importProgress} />
          </div>
        )}
        
        {contextIsProcessing && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Processing your input...</span>
            </div>
            <ProcessingProgress />
          </div>
        )}
        
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 bg-zinc-900 rounded-md px-3 py-2 flex items-center border border-zinc-800">
            <span className="text-zinc-500 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
              disabled={contextIsProcessing || isImporting}
            className="command-input terminal-text text-white bg-transparent border-none outline-none w-full"
          />
          {contextIsProcessing && (
              <Loader2 className="h-4 w-4 text-zinc-500 animate-spin" />
          )}
        </div>
        
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.json,.csv,.pdf,.md"
          />
          
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp"
          />
          
          <div className="flex space-x-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
              onClick={handleTextFileClick}
              disabled={contextIsProcessing || isImporting}
              className="h-9 w-9 rounded-md bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
              title="Import document (.txt, .json, .csv, .pdf, .md)"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
        </Button>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleImageFileClick}
              disabled={contextIsProcessing || isImporting || !apiKey}
              className="h-9 w-9 rounded-md bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
              title="Import image (.jpg, .jpeg, .png, .gif, .webp)"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>
        
        <Button
          type="submit"
            disabled={!input.trim() || contextIsProcessing || isImporting}
            className="bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
        >
          {contextIsProcessing ? (
              <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing
              </>
            ) : "Send"}
        </Button>
      </form>
    </div>
      
      {/* Dialog for file contextual information */}
      <Dialog open={showFileDialog} onOpenChange={(open) => {
        // When dialog is closed externally, ensure we reset everything
        if (!open) {
          cancelFileDialog();
        }
        setShowFileDialog(open);
      }}>
        <DialogContent className="sm:max-w-md bg-zinc-900 text-white border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {fileDialogType === 'image' ? 'Image Analysis' : 'File Import'}
            </DialogTitle>
            <div className="text-zinc-400 text-sm pt-2">
              {selectedFile?.name && (
                <p>Selected file: <span className="text-zinc-300 font-medium">{selectedFile.name}</span></p>
              )}
              <p className="mt-2">
                {fileDialogType === 'image' 
                  ? 'Add specific instructions for analyzing this image' 
                  : 'Add context or tags for this file import'}
              </p>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="context" className="text-white">
                {fileDialogType === 'image' 
                  ? 'What should be analyzed in this image?' 
                  : 'Add tags or notes about this file'}
              </Label>
              <Textarea
                id="context"
                placeholder={fileDialogType === 'image' 
                  ? "E.g., Describe what's in this image, identify text, analyze the design..."
                  : "E.g., #research #notes These are my meeting notes from today"}
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="min-h-28 bg-zinc-950 border-zinc-800 text-white"
              />
              {fileDialogType === 'image' && (
                <p className="text-xs text-zinc-500 mt-1">
                  The image will be processed privately and only the final analysis will appear in the chat.
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button" 
              variant="outline"
              onClick={cancelFileDialog}
              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={() => {
                debugger; // <<< Breakpoint 4: Inside Analyze Image onClick
                processSelectedFile();
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              {fileDialogType === 'image' ? 'Analyze Image' : 'Process File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommandInput;