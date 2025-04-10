// SQLite database service for Syndicate
// Note: In a web context, we're using IndexedDB as our "SQLite" equivalent

export interface Thought {
  id?: number;
  timestamp: string;
  input: string;
  output: string;
  tags?: string[];
  summary?: string;
  embedding?: number[];
  error?: string;
}

class SyndicateDB {
  private dbName = 'syndicate-mind-vault';
  private db: IDBDatabase | null = null;
  
  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create thoughts table if it doesn't exist
        if (!db.objectStoreNames.contains('thoughts')) {
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
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async saveThought(thought: Thought): Promise<number> {
    const db = await this.initDB();
    
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

  async getThoughtById(id: number): Promise<Thought | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['thoughts'], 'readonly');
      const store = transaction.objectStore('thoughts');
      
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAllThoughts(): Promise<Thought[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['thoughts'], 'readonly');
      const store = transaction.objectStore('thoughts');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Sort by timestamp to ensure chronological order
        const results = request.result || [];
        results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        resolve(results);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getThoughtsByTag(tag: string): Promise<Thought[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['thoughts'], 'readonly');
      const store = transaction.objectStore('thoughts');
      const index = store.index('tags');
      
      const request = index.getAll(tag);
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async searchThoughtsByContent(query: string): Promise<Thought[]> {
    // Simple text search implementation
    // In a real implementation, we would use embeddings and cosine similarity
    const thoughts = await this.getAllThoughts();
    
    return thoughts.filter(thought => 
      thought.input.toLowerCase().includes(query.toLowerCase()) ||
      thought.output.toLowerCase().includes(query.toLowerCase()) ||
      thought.summary?.toLowerCase().includes(query.toLowerCase()) === true
    );
  }

  async getRecentThoughts(limit: number = 10): Promise<Thought[]> {
    const thoughts = await this.getAllThoughts();
    
    // Sort by timestamp (newest first) and limit
    return thoughts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async clearAllThoughts(): Promise<void> {
    console.log("SyndicateDB: Clearing all thoughts from database");
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['thoughts'], 'readwrite');
      const store = transaction.objectStore('thoughts');
      
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log("SyndicateDB: Successfully cleared all thoughts");
        resolve();
      };
      
      request.onerror = () => {
        console.error("SyndicateDB: Error clearing thoughts", request.error);
        reject(request.error);
      };
    });
  }
}

// Export a singleton instance
export const syndicateDB = new SyndicateDB();
