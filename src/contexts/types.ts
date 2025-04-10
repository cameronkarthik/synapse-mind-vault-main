export interface UserProfile {
  name: string;
  avatarUrl?: string | null;
  lastLogin?: string;
  preferences?: Record<string, any>;
}

export interface UserCustomization {
  displayTags?: boolean;
  showContinuationSuggestions?: boolean;
}

export interface Thought {
  id?: number;
  timestamp: string;
  input: string;
  output: string;
  tags?: string[];
  summary?: string;
  error?: string;
}

export type RecordingState = 'inactive' | 'recording' | 'processing';

export interface SyndicateContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  thoughts: Thought[];
  allThoughts: Thought[];
  addThought: (thought: Thought) => void;
  updateThought: (thought: Thought) => void;
  isProcessing: boolean;
  commandHistory: string[];
  historyIndex: number;
  setHistoryIndex: (index: number | ((prevIndex: number) => number)) => void;
  handleInput: (input: string) => Promise<void>;
  processCommand: (command: string, content: string) => Promise<string>;
  searchThoughts: (query: string) => Promise<Thought[]>;
  getRecentThoughts: (limit?: number) => Promise<Thought[]>;
  userProfile: UserProfile | null;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  hideChatHistory: boolean;
  setHideChatHistory: (hide: boolean) => void;
  clearChatHistory: () => Promise<void>;
  logout: () => void;
  customization: UserCustomization;
  updateCustomization: (settings: Partial<UserCustomization>) => void;
  syndicateDB: any;
}
