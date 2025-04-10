import { syndicateDB } from '@/lib/db';
import { generateAIResponse, generateSummary } from '@/lib/ai';
import { Thought } from './types';

export const filterMeaningfulThoughts = (thoughts: Thought[]): Thought[] => {
  return thoughts.filter(thought => {
    const isCommand = thought.input.trim().startsWith('/');
    const isError = thought.tags.includes('error') || 
                    thought.output.toLowerCase().includes('error:') ||
                    thought.output.toLowerCase().includes('failed to');
    const isSystem = thought.tags.includes('system');
    
    return !isCommand && !isError && !isSystem;
  });
};

export const createCommandProcessor = (apiKey: string) => {
  const requireApiKey = () => {
    if (!apiKey) {
      throw new Error("To use this feature, you'll need to add your OpenAI API key. Click the settings icon in the top right corner to add your key.");
    }
  };

  const processCommand = async (command: string, content: string): Promise<string> => {
    switch (command.toLowerCase()) {
      case 'recall':
      case 'find':  // alias for recall
        if (!content.trim()) {
          return "Please specify what to recall. Examples: /recall #tag, /recall keyword, or /recall recent";
        }
        
        let results: Thought[];
        
        if (content.startsWith('#')) {
          const tag = content.substring(1).trim();
          results = await syndicateDB.getThoughtsByTag(tag);
          
          const meaningfulThoughts = filterMeaningfulThoughts(results);
          
          return results.length > 0
            ? `Found ${meaningfulThoughts.length} thoughts with tag "${tag}":\n\n` + 
              meaningfulThoughts.map(t => `- ${t.summary} (${new Date(t.timestamp).toLocaleDateString()})`).join('\n')
            : `No thoughts found with tag "${tag}"`;
        } else if (content.toLowerCase() === 'recent') {
          results = await syndicateDB.getRecentThoughts(5);
          
          const meaningfulThoughts = filterMeaningfulThoughts(results);
          
          return results.length > 0
            ? `Your ${meaningfulThoughts.length} most recent thoughts:\n\n` + 
              meaningfulThoughts.map(t => `- ${t.summary} (${new Date(t.timestamp).toLocaleDateString()})`).join('\n')
            : `No thoughts found in your database`;
        } else {
          results = await syndicateDB.searchThoughtsByContent(content);
          
          const meaningfulThoughts = filterMeaningfulThoughts(results);
          
          return results.length > 0
            ? `Found ${meaningfulThoughts.length} thoughts matching "${content}":\n\n` + 
              meaningfulThoughts.map(t => `- ${t.summary} (${new Date(t.timestamp).toLocaleDateString()})`).join('\n')
            : `No thoughts found matching "${content}"`;
        }
        
      case 'summarize':
        requireApiKey();
        if (content.includes('last')) {
          const timeMatch = content.match(/last\s+(\d+)\s+(day|days|week|weeks|month|months)/i);
          
          if (!timeMatch) {
            return "Please specify a time period. Example: /summarize last 7 days";
          }
          
          const [, countStr, unit] = timeMatch;
          const count = parseInt(countStr);
          
          const now = new Date();
          const then = new Date();
          
          if (unit.includes('day')) {
            then.setDate(now.getDate() - count);
          } else if (unit.includes('week')) {
            then.setDate(now.getDate() - (count * 7));
          } else if (unit.includes('month')) {
            then.setMonth(now.getMonth() - count);
          }
          
          const allThoughts = await syndicateDB.getAllThoughts();
          
          const filteredThoughts = allThoughts.filter(thought => {
            const thoughtDate = new Date(thought.timestamp);
            return thoughtDate >= then && thoughtDate <= now;
          });
          
          const meaningfulThoughts = filterMeaningfulThoughts(filteredThoughts);
          
          if (meaningfulThoughts.length === 0) {
            return `No meaningful thoughts found in the last ${count} ${unit}.`;
          }
          
          // If we have too many thoughts, summarize them in chunks to avoid token limits
          if (meaningfulThoughts.length > 20) {
            console.log(`Summarizing ${meaningfulThoughts.length} thoughts in chunks to avoid token limits`);
            
            // Prepare chunked summarization
            const CHUNK_SIZE = 10; // Number of thoughts per chunk
            const chunks = [];
            
            // Create chunks of thoughts
            for (let i = 0; i < meaningfulThoughts.length; i += CHUNK_SIZE) {
              chunks.push(meaningfulThoughts.slice(i, i + CHUNK_SIZE));
            }
            
            console.log(`Created ${chunks.length} chunks of thoughts`);
            
            // Process each chunk and get a mini-summary
            const chunkSummaries = [];
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const chunkText = chunk
                .map(t => {
                  // Limit the size of each thought to avoid excessive tokens
                  const limitedInput = t.input.length > 500 ? t.input.substring(0, 500) + '...' : t.input;
                  const limitedOutput = t.output.length > 500 ? t.output.substring(0, 500) + '...' : t.output;
                  return `Date: ${new Date(t.timestamp).toLocaleDateString()}\nThought: ${limitedInput}\nResponse: ${limitedOutput}`;
                })
                .join('\n\n');
              
              // Generate a summary for this chunk
              try {
                const chunkSummaryPrompt = `Summarize these ${chunk.length} thoughts (chunk ${i+1}/${chunks.length}):\n\n${chunkText}`;
                const chunkSummary = await generateAIResponse({ 
                  prompt: chunkSummaryPrompt, 
                  apiKey,
                  model: 'gpt-3.5-turbo' // Use cheaper model for chunk summaries
                });
                
                chunkSummaries.push(chunkSummary);
                console.log(`Generated summary for chunk ${i+1}/${chunks.length}`);
              } catch (error) {
                console.error(`Error summarizing chunk ${i+1}:`, error);
                chunkSummaries.push(`[Error summarizing chunk ${i+1}]`);
              }
            }
            
            // Now create a final summary of summaries
            const finalSummaryPrompt = `You are summarizing a user's thoughts over the past ${count} ${unit}. 
            
Below are summaries of chunks of thoughts from this period. Please create a cohesive final summary that includes key themes, insights, and patterns:

${chunkSummaries.map((summary, i) => `Chunk ${i+1} Summary:\n${summary}`).join('\n\n')}`;
            
            const finalSummary = await generateAIResponse({ 
              prompt: finalSummaryPrompt, 
              apiKey,
              model: 'gpt-4o' // Use better model for final synthesis
            });
            
            return finalSummary;
          } else {
            // For a smaller number of thoughts, we can process them directly
            const thoughtsText = meaningfulThoughts
              .map(t => {
                // Still limit the size of each thought as a precaution
                const limitedInput = t.input.length > 1000 ? t.input.substring(0, 1000) + '...' : t.input;
                const limitedOutput = t.output.length > 1000 ? t.output.substring(0, 1000) + '...' : t.output;
                return `Date: ${new Date(t.timestamp).toLocaleDateString()}\nThought: ${limitedInput}\nResponse: ${limitedOutput}`;
              })
              .join('\n\n');
            
            const summaryPrompt = `Summarize these thoughts from the last ${count} ${unit}:\n\n${thoughtsText}`;
            const summary = await generateAIResponse({ 
              prompt: summaryPrompt, 
              apiKey,
              model: 'gpt-4o'
            });
            
            return summary;
          }
        }
        
        return "Unsupported summarize command. Try /summarize last 7 days";
      
      case 'import':
        // Handle empty content case
        if (!content.trim()) {
          return "Ready to import. You can use the document icon button to select and upload a file, or provide parameters like: from:filename.txt tag:mytag";
        }
        
        // Extract file name from content if provided
        const fromMatch = content.match(/from:([^,\s]+)/);
        const fileName = fromMatch ? fromMatch[1].trim() : 'file';
        
        // Extract tag if provided
        const tagMatch = content.match(/tag:([^,\s]+)/);
        const tag = tagMatch ? tagMatch[1].trim() : 'import';
        
        // Determine file type
        const typeMatch = content.match(/type:([^,\s]+)/);
        const fileType = typeMatch ? typeMatch[1].trim().toLowerCase() : 'text';
        
        // Success message based on file type
        if (fileType === 'image') {
          return `Image "${fileName}" has been imported. The AI's analysis of the image will be processed in your next message. You can find this information later using /recall #${tag} or by searching for specific content.`;
        } else {
          return `File "${fileName}" has been imported. Its contents will be processed and added to your knowledge base. You can find this information later using /recall #${tag} or by searching for specific content.`;
        }
        
      case 'tag':
        requireApiKey();
        if (!content.trim()) {
          return "Please specify a tag and a thought. Example: /tag crypto This is my thought about cryptocurrency";
        }
        
        const tagCmdMatch = content.match(/^(\S+)\s+(.+)$/);
        if (!tagCmdMatch) {
          return "Invalid format. Please use: /tag tagname Your thought content";
        }
        
        const [, tagName, thoughtText] = tagCmdMatch;
        
        const response = await generateAIResponse({ prompt: thoughtText, apiKey });
        
        const summary = await generateSummary({ prompt: thoughtText, apiKey });
        
        const newThought: Thought = {
          timestamp: new Date().toISOString(),
          input: thoughtText,
          output: response,
          tags: [tagName.toLowerCase()],
          summary
        };
        
        await syndicateDB.saveThought(newThought);
        
        return response;
        
      case 'journal':
      case 'note':
        if (!content.trim()) {
          return "Please add some content to your note.";
        }
        
        return `Your ${command} has been saved.`;
        
      case 'help':
      case '//':  // alias for help
        return `## 🧠 Syndicate Mind Commands

### 🔍 Search & Recall
- **/recall #tag** - Search thoughts by specific tag
- **/recall keyword** - Search thoughts by keyword
- **/recall recent** - Show your most recent thoughts
- **/find** - Alias for /recall

### 💾 Saving Information
- **/save** - Save the previous thought for later reference
- **/tag #tag1 #tag2** - Tag the previous thought with categories
- **/import** - Import content from files (.txt, .json, .csv, .pdf, .md)
- **/clear** - Clear current chat history

### 📊 Analysis & Summaries
- **/summarize last 7 days** - Get a summary of recent thoughts
- **/analyze** - Generate insights from your conversation
- **/count** - Count tokens in the current conversation

### ⚙️ Configuration & Help
- **/help** - Show this command list
- **/settings** - Configure your OpenAI API key
- **//** - Alias for /help

**Note**: Some commands require an OpenAI API key. You can add your API key in the settings.

**Examples**:
- **/recall #work** - Find all thoughts tagged with "work"
- **/summarize last 30 days** - Summarize the last month's thoughts`;
        
      default:
        return `Unknown command: /${command}. Type /help to see available commands.`;
    }
  };

  return {
    processCommand
  };
};
