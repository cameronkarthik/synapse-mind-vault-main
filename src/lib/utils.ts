import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "MMMM d, yyyy 'at' h:mm a");
}

export function extractCommandFromInput(input: string): { command: string | null; content: string } {
  // Match commands like /recall, /tag, /journal, etc.
  const commandMatch = input.match(/^\/([a-z]+)(?:\s+(.*))?$/);
  
  if (commandMatch) {
    const [, command, restOfInput = ''] = commandMatch;
    return { command, content: restOfInput.trim() };
  }
  
  return { command: null, content: input };
}

export function parseTagsFromInput(input: string): { tags: string[]; cleanedInput: string } {
  // Match hashtags in the input
  const tags: string[] = [];
  let cleanedInput = input;
  
  // Extract explicit hashtags
  const hashtagRegex = /#([a-zA-Z0-9]+)/g;
  let match;
  
  while ((match = hashtagRegex.exec(input)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  
  // Remove hashtags from the input for cleaner processing
  cleanedInput = cleanedInput.replace(hashtagRegex, '').trim();
  
  return { tags, cleanedInput };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getRandomGreeting(): string {
  const greetings = [
    "How can Syndicate help you today?",
    "Ready to capture your ideas.",
    "What's on your mind?",
    "How can Syndicate help you today?",
    "Ready to think with you.",
    "Let's organize your thoughts together.",
    "What would you like to explore today?",
    "Your local AI assistant is ready."
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function extractChartData(text: string): {
  type: 'bar' | 'line';
  data: Array<{ name: string; value: number }>;
  title?: string;
}[] {
  const charts: {
    type: 'bar' | 'line';
    data: Array<{ name: string; value: number }>;
    title?: string;
  }[] = [];
  
  // Look for chart data patterns in the text
  const chartDataRegex = /chart data:([\s\S]*?)(?=chart data:|$)/gi;
  let chartMatch;
  
  while ((chartMatch = chartDataRegex.exec(text)) !== null) {
    try {
      const chartSection = chartMatch[1].trim();
      
      // Extract title if present
      let title: string | undefined;
      const titleMatch = chartSection.match(/title:\s*(.*?)(?:\n|$)/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      // Determine chart type (default to bar)
      let type: 'bar' | 'line' = 'bar';
      const typeMatch = chartSection.match(/type:\s*(bar|line)(?:\n|$)/i);
      if (typeMatch) {
        type = typeMatch[1].toLowerCase() as 'bar' | 'line';
      }
      
      // Extract data
      const dataLines = chartSection.split('\n').filter(line => 
        line.includes(':') && 
        !line.toLowerCase().includes('title:') && 
        !line.toLowerCase().includes('type:')
      );
      
      if (dataLines.length > 0) {
        const data = dataLines.map(line => {
          const [name, valueStr] = line.split(':').map(part => part.trim());
          const value = parseFloat(valueStr);
          return { name, value: isNaN(value) ? 0 : value };
        });
        
        charts.push({ type, data, title });
      }
    } catch (error) {
      console.error('Error parsing chart data:', error);
    }
  }
  
  // Also look for table data that could be visualized
  if (charts.length === 0) {
    const tableRegex = /\|([^|]+)\|([^|]+)\|(?:\n\|[:-]+\|[:-]+\|)(?:\n\|([^|]+)\|([^|]+)\|)+/g;
    let tableMatch;
    
    while ((tableMatch = tableRegex.exec(text)) !== null) {
      try {
        const headerRow = text.substring(tableMatch.index).split('\n')[0];
        const headers = headerRow.split('|').filter(Boolean).map(h => h.trim());
        
        // Only process tables with 2 columns where the second looks like it contains numbers
        if (headers.length === 2) {
          const rows = text.substring(tableMatch.index).split('\n').slice(2);
          const data = [];
          
          for (const row of rows) {
            if (!row.includes('|')) continue;
            
            const cols = row.split('|').filter(Boolean).map(c => c.trim());
            if (cols.length === 2) {
              const value = parseFloat(cols[1]);
              if (!isNaN(value)) {
                data.push({ name: cols[0], value });
              }
            }
          }
          
          if (data.length > 0) {
            charts.push({ 
              type: 'bar', 
              data, 
              title: `${headers[0]} vs ${headers[1]}`
            });
          }
        }
      } catch (error) {
        console.error('Error parsing table data for chart:', error);
      }
    }
  }
  
  return charts;
}

export function fixToastId(toast: any): any {
  // Ensure toast returns a valid toast object with id
  if (toast && typeof toast === 'object' && !toast.id && toast.children) {
    return { ...toast, id: Math.random().toString(36).substr(2, 9) };
  }
  return toast;
}

/**
 * Extract hashtags and key topics from content
 * @param content - The content to extract tags from
 * @returns Array of tags
 */
export function extractTagsFromContent(content: string): string[] {
  const tags: string[] = [];
  
  // Extract explicit hashtags
  const hashtagRegex = /#([a-zA-Z0-9]+)/g;
  let match;
  
  while ((match = hashtagRegex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  
  // Extract key words/topics based on frequency and relevance
  // This is a simple implementation - could be enhanced with NLP
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !['this', 'that', 'with', 'from', 'have', 'your', 'would', 'could', 'should', 'about'].includes(word)
    );
  
  // Count word frequency
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Get top words by frequency
  const topWords = Object.entries(wordCounts)
    .filter(([word, count]) => count > 1)  // Only words that appear more than once
    .sort((a, b) => b[1] - a[1])  // Sort by frequency
    .slice(0, 3)  // Take top 3
    .map(([word]) => word);
  
  // Combine explicit hashtags and top words, removing duplicates
  return [...new Set([...tags, ...topWords])];
}

/**
 * Clean and format AI response text for better readability
 * @param content - The AI response content
 * @returns Cleaned and formatted content
 */
export function cleanSpeakingContent(content: string): string {
  if (!content) return '';
  
  // Remove any markdown code block formatting if present
  let cleaned = content.replace(/```[a-z]*\n([\s\S]*?)```/g, '$1');
  
  // Ensure proper spacing after punctuation
  cleaned = cleaned.replace(/([.!?])(\w)/g, '$1 $2');
  
  // Fix multiple consecutive newlines (limit to max 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Ensure there's no leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Simple token estimation (adjust multiplier as needed)
const CHARS_PER_TOKEN = 4;
export const estimateTokenCount = (text: string): number => {
  if (!text) return 0;
  // Basic estimate: divide character count by average characters per token
  // A more accurate approach would involve a proper tokenizer library (like tiktoken)
  // but this is a reasonable approximation for context limiting.
  return Math.ceil(text.length / CHARS_PER_TOKEN);
};
