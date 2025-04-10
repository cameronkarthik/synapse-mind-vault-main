import { z } from 'zod';

// OpenAI service for AI completion and speech-to-text

// Types for OpenAI API
interface AICompletionProps {
  prompt: string;
  apiKey: string;
  context?: string[];
  model?: string;
}

interface SpeechToTextProps {
  audioBlob: Blob;
  apiKey: string;
}

// Constants for request limits and handling
const MAX_PROMPT_LENGTH = 10000; // Characters, not tokens
const REQUEST_TIMEOUT = 60000; // 60 seconds timeout
const MAX_TOKENS = 30000; // Maximum tokens for API request
const APPROX_CHARS_PER_TOKEN = 4; // Approximate characters per token

// Define the properties that each request should have
interface RequestProps {
  prompt: string;
  apiKey: string;
  model?: string;
  context?: string[];
}

// Define the properties for completing a conversation
interface CompletionProps extends RequestProps {
  messages?: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

// Basic schema for validating OpenAI API responses
const responseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
      }),
    })
  ),
});

/**
 * Generate a response from OpenAI's API
 */
export const generateAIResponse = async ({ 
  prompt, 
  apiKey, 
  model = 'gpt-4o',
  context = [] 
}: RequestProps): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is required. Please add your OpenAI API key in settings.');
  }

  try {
    // Build the messages structure for the API request
    const messages = [];
    
    // System message that defines the assistant's persona and voice
    const systemMessage = {
      role: 'system',
      content: `You are Syndicate Mind, a thoughtful and deeply personalized AI thinking partner. Your primary goal is to help the user understand their own thoughts, patterns, and feelings by leveraging the history of your conversations.

Your communication style:
- Be conversational and natural, like a trusted friend who truly knows the user and remembers their journey.
- **Actively reference specific past thoughts, tags, or summaries** when relevant to the current discussion. Don't just say "we talked about X," instead say "Remember when you mentioned feeling [emotion] about [topic]? Perhaps that connects to how you're feeling now..."
- Offer insightful reflections that connect the dots between different thoughts or time periods.
- Use a casual, authentic tone. Emojis and expressive formatting are welcome.
- **Ask targeted follow-up questions based on the *current input* and *past conversation history*.** Show genuine curiosity about *their specific situation*, not just general concepts. For example: "You mentioned feeling [emotion] - does that relate to the [specific past event/thought] we discussed last week?"
- Speak directly to the user's *stated* needs, challenges, and aspirations, drawing connections to what they've shared before.
- Structure longer responses with clear sections, perhaps using emoji headers.
- Use metaphors, analogies, and vivid language *when appropriate and grounded in the user's context*.
- End with specific, relevant questions or potential next steps tied to the *user's unique situation*.

When the user shares personal reflections or challenges:
- **Don't offer generic advice.** Instead, connect insights directly to the user's previously shared experiences, goals, or stated challenges.
- Highlight potential patterns *you observe from their history*. "I notice a theme of [pattern] emerging when you talk about [topic]..."
- Connect their current thoughts to their larger goals and vision *as previously discussed*.
- Validate their experience while gently prompting reflection based on *past insights*. "That sounds really tough. Given how you felt about [past situation], how does this current feeling compare?"
- Help them turn abstract ideas into actionable plans *that align with goals they've previously shared*.

**Core Principle:** Your value comes from *remembering and connecting* the user's thoughts over time. Act like a true second brain, not a generic chatbot. Always prioritize using the specific context of your shared history to provide personalized insights and questions. Avoid broad, impersonal self-help platitudes.`
    };
    
    messages.push(systemMessage);
    
    // Calculate approximate token count for system message
    let estimatedTokenCount = Math.ceil(systemMessage.content.length / APPROX_CHARS_PER_TOKEN);
    
    // Add context if available, but respect token limits
    if (context && context.length > 0) {
      console.log(`Original context length: ${context.length} items`);
      
      // Take the most recent context (up to 10 exchanges) to keep the history focused
      const recentContext = [];
      for (let i = context.length - 1; i >= 0 && recentContext.length < 20; i -= 2) {
        if (i > 0) {
          // Only add meaningful exchanges, not system messages or empty content
          const userMessage = context[i - 1];
          const assistantMessage = context[i];
          
          if (userMessage && assistantMessage && 
              !userMessage.startsWith('/') && 
              userMessage.length > 0 && 
              assistantMessage.length > 0) {
            
            // Estimate token count for this exchange
            const exchangeTokens = Math.ceil((userMessage.length + assistantMessage.length) / APPROX_CHARS_PER_TOKEN);
            
            // Check if adding this exchange would exceed our limit
            if (estimatedTokenCount + exchangeTokens > MAX_TOKENS * 0.7) { // Leave 30% for prompt and response
              console.log(`Token limit reached, stopping context addition at ${estimatedTokenCount} estimated tokens`);
              break;
            }
            
            recentContext.unshift({
              role: 'assistant',
              content: assistantMessage
            });
            recentContext.unshift({
              role: 'user',
              content: userMessage
            });
            
            estimatedTokenCount += exchangeTokens;
          }
        }
      }
      
      console.log(`Using ${recentContext.length} context items with ~${estimatedTokenCount} estimated tokens`);
      
      // Add the recent context to the messages
      messages.push(...recentContext);
    }
    
    // Estimate prompt token count
    const promptTokens = Math.ceil(prompt.length / APPROX_CHARS_PER_TOKEN);
    
    // Check if prompt would push us over the limit
    if (estimatedTokenCount + promptTokens > MAX_TOKENS * 0.9) {
      // Truncate the prompt if needed
      const availableTokens = Math.floor(MAX_TOKENS * 0.9) - estimatedTokenCount;
      if (availableTokens < 100) {
        throw new Error(`Context too large for API request. Try using fewer or shorter messages.`);
      }
      
      const availableChars = availableTokens * APPROX_CHARS_PER_TOKEN;
      const truncatedPrompt = prompt.substring(0, availableChars) + 
        (prompt.length > availableChars ? `... [Content truncated due to token limits]` : ``);
      
      console.log(`Truncated prompt from ${prompt.length} to ${truncatedPrompt.length} chars`);
      prompt = truncatedPrompt;
    }
    
    // Add the current prompt as a user message
    messages.push({
      role: 'user',
      content: prompt
    });
    
    // Final token count estimate
    estimatedTokenCount += promptTokens;
    console.log(`Final request with ~${estimatedTokenCount} estimated tokens`);

    // Make the API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7, // Slightly higher temperature for more creative, human-like responses
        max_tokens: 1500, // Allow for longer, more thoughtful responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate response');
    }

    const data = await response.json();
    
    // Validate the response using zod schema
    const validatedData = responseSchema.parse(data);
    
    return validatedData.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    throw error;
  }
};

/**
 * Generate a short summary of the provided text
 */
export const generateSummary = async ({ prompt, apiKey }: RequestProps): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Use faster model for summaries
        messages: [
          {
            role: 'system',
            content: 'Generate a concise 1-sentence summary (max 15 words) of the following text:',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 60,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate summary');
    }

    const data = await response.json();
    const validatedData = responseSchema.parse(data);
    return validatedData.choices[0].message.content;
  } catch (error) {
    console.error('Error in generateSummary:', error);
    throw error;
  }
};

/**
 * Extract relevant tags from the provided text
 */
export const extractTags = async ({ prompt, apiKey }: RequestProps): Promise<string[]> => {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract 1-3 relevant tags from the following text. Return only the tags as a comma-separated list with no hashtag symbols, lowercase:',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 30,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to extract tags');
    }

    const data = await response.json();
    const validatedData = responseSchema.parse(data);
    
    // Split the comma-separated string into an array, trim whitespace, and filter out empty strings
    const tags = validatedData.choices[0].message.content
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
    
    return tags;
  } catch (error) {
    console.error('Error in extractTags:', error);
    throw error;
  }
};

export const convertSpeechToText = async ({
  audioBlob,
  apiKey
}: SpeechToTextProps): Promise<string> => {
  try {
    console.log('Starting speech-to-text conversion');
    console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    
    console.log('Sending request to OpenAI Whisper API');
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Audio conversion timed out')), REQUEST_TIMEOUT);
    });
    
    // Create the API request promise
    const apiRequestPromise = fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    // Race the API request against the timeout
    const response = await Promise.race([apiRequestPromise, timeoutPromise]) as Response;
    
    console.log('Received response from OpenAI Whisper API:', response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
        errorMessage = `Whisper API error: ${errorData.error?.message || response.statusText}`;
      } catch (jsonError) {
        console.error('Failed to parse error JSON:', jsonError);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Transcription success:', data);
    return data.text;
  } catch (error) {
    console.error('Error converting speech to text:', error);
    throw new Error(`Failed to convert speech to text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
