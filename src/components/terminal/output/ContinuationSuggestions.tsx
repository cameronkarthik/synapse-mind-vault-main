import React, { useEffect, useState } from 'react';
import ContinuationButtons from '../ContinuationButtons';
import { useSyndicate } from '@/contexts/SynapseContext';

interface ContinuationSuggestionsProps {
  text: string;
  onContinue: (question: string) => void;
  isError: boolean;
}

// Improved version of question extraction
const extractContinuationQuestions = (text: string): string[] => {
  if (!text) return [];
  
  // Skip generating questions for very short responses
  if (text.length < 50) {
    // For greetings, provide contextually relevant continuation options
    if (text.match(/hello|hi|hey|greetings|welcome/i)) {
      return [
        "What can you help me with?",
        "Tell me about your capabilities",
        "How does this AI assistant work?"
      ];
    }
    return [];
  }
  
  const questions = new Set<string>();
  
  // First priority: Look for explicit questions in the AI's response
  const explicitQuestionPatterns = [
    // Look for questions the AI directly suggests
    /(?:you might (?:ask|consider|want to know))(?:[:\s]+)["']?([^"'.!?]+\??)["']?/gi,
    // Look for "would you like" suggestions
    /(?:would you like (?:me to|to))(?:[:\s]+)?["']?([^"'.!?]+\??)["']?/gi,
    // Capture "do you want to know" patterns
    /(?:do you want (?:me to|to))(?:[:\s]+)?["']?([^"'.!?]+\??)["']?/gi
  ];
  
  for (const pattern of explicitQuestionPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const question = match[1].trim();
        // Ensure it ends with a question mark
        const formattedQuestion = question.endsWith('?') ? question : `${question}?`;
        if (formattedQuestion.length > 10 && formattedQuestion.length < 80) {
          questions.add(formattedQuestion);
        }
      }
    }
  }
  
  // Second priority: Extract key topics and create follow-up questions about them
  if (questions.size < 3) {
    // Identify the primary topics from the response
    const primaryTopic = identifyPrimaryTopics(text);
    
    if (primaryTopic.length > 0) {
      for (const topic of primaryTopic) {
        if (questions.size < 3) {
          const contextualQuestion = generateContextualQuestion(topic, text);
          if (contextualQuestion) {
            questions.add(contextualQuestion);
          }
        }
      }
    }
  }
  
  // Third priority: Use topic detection based on meaningful phrases
  if (questions.size < 3) {
    // Find meaningful phrases and noun combinations
    const phrases = extractMeaningfulPhrases(text);
    
    for (const phrase of phrases) {
      if (questions.size >= 3) break;
      
      if (phrase.length > 3 && phrase.length < 30) {
        // Skip phrases that are just common words
        if (!isCommonPhrase(phrase)) {
          const question = generateTopicBasedQuestion(phrase);
          if (question) {
            questions.add(question);
          }
        }
      }
    }
  }
  
  // Fourth priority: Determine the type of response and generate appropriate follow-ups
  if (questions.size < 3) {
    const responseType = determineResponseType(text);
    const genericQuestions = generateGenericQuestionsByType(responseType);
    
    for (const question of genericQuestions) {
      if (questions.size >= 3) break;
      questions.add(question);
    }
  }
  
  // Return up to 3 questions
  return [...questions].slice(0, 3);
};

// Helper function to identify primary topics in the text
const identifyPrimaryTopics = (text: string): string[] => {
  const topics = new Set<string>();
  
  // Look for phrases after "about", "regarding", "concerning"
  const aboutPatterns = /(?:about|regarding|concerning|discussing|explaining)\s+(?:the\s+)?([a-zA-Z0-9\s]+?)(?:\.|,|\s+and|\s+or|\s+but|\s+which|\s+that|\s+when|\s+if|\s+because|\n|$)/gi;
  const aboutMatches = text.matchAll(aboutPatterns);
  
  for (const match of aboutMatches) {
    if (match[1] && match[1].length > 3 && match[1].length < 30) {
      topics.add(match[1].trim());
    }
  }
  
  // Look for key phrases in quotes or with emphasis
  const emphasisPatterns = /["']([^"']{5,30})["']|(?:\*\*|__)([^*_]{5,30})(?:\*\*|__)/g;
  const emphasisMatches = text.matchAll(emphasisPatterns);
  
  for (const match of emphasisMatches) {
    const phrase = (match[1] || match[2]).trim();
    if (phrase && phrase.length > 3) {
      topics.add(phrase);
    }
  }
  
  // Look for things defined with "is a" or "are"
  const definitionPatterns = /\b([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+(?:is|are)\s+(?:a|an|the)\s+([a-z]+)/g;
  const definitionMatches = text.matchAll(definitionPatterns);
  
  for (const match of definitionMatches) {
    if (match[1] && match[1].length > 3) {
      topics.add(match[1].trim());
    }
  }
  
  // Extract frequent words that might be important topics
  const words = text.split(/\s+/);
  const wordFrequency: Record<string, number> = {};
  
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanWord.length > 4) {
      wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
    }
  }
  
  // Get words that appear multiple times
  const frequentWords = Object.entries(wordFrequency)
    .filter(([_, count]) => count > 2)
    .map(([word]) => word);
  
  for (const word of frequentWords) {
    if (word.length > 4 && !isCommonWord(word)) {
      topics.add(word);
    }
  }
  
  return Array.from(topics).slice(0, 5);
};

// Helper to extract meaningful phrases
const extractMeaningfulPhrases = (text: string): string[] => {
  const phrases: string[] = [];
  
  // Look for noun phrases (potential topics)
  const nounPatterns = /\b([A-Z][a-z]+(?:\s+[a-z]+){0,3})\b|\b(?:the|your|my|a|an)\s+([a-z]+(?:\s+[a-z]+){0,3})\b/g;
  const nounMatches = text.matchAll(nounPatterns);
  
  for (const match of nounMatches) {
    const phrase = (match[1] || match[2])?.trim();
    if (phrase && phrase.length > 3 && !phrases.includes(phrase)) {
      phrases.push(phrase);
    }
  }
  
  // Section headers are often important topics
  const headerPattern = /(?:^|\n)(?:#{1,3}|[A-Z][A-Z\s]+:)\s+([^#\n]+)/gm;
  const headerMatches = text.matchAll(headerPattern);
  
  for (const match of headerMatches) {
    if (match[1] && match[1].length > 3) {
      phrases.push(match[1].trim());
    }
  }
  
  return phrases;
};

// Generate a contextual question based on the topic and context
const generateContextualQuestion = (topic: string, context: string): string | null => {
  // Check what the context contains to generate appropriate questions
  const isHowTo = context.includes('how to') || context.includes('steps') || context.includes('process');
  const isProblem = context.includes('problem') || context.includes('issue') || context.includes('challenge');
  const isComparison = context.includes('versus') || context.includes(' vs ') || context.includes('compared to');
  const hasExample = context.includes('example') || context.includes('instance') || context.includes('case');
  
  // Format topic for better display in questions
  const formattedTopic = topic.charAt(0).toLowerCase() + topic.slice(1);
  
  if (isHowTo) {
    return `What's the most important step when working with ${formattedTopic}?`;
  } else if (isProblem) {
    return `What are common challenges people face with ${formattedTopic}?`;
  } else if (isComparison) {
    return `What are the key differences with ${formattedTopic}?`;
  } else if (hasExample) {
    return `Can you provide another example related to ${formattedTopic}?`;
  } else {
    // Default questions based on the topic
    const questions = [
      `How can I apply ${formattedTopic} in my daily life?`,
      `What's a practical application of ${formattedTopic}?`,
      `Can you explain more about ${formattedTopic}?`,
      `What should I know about ${formattedTopic} that isn't obvious?`
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }
};

// Generate topic-based questions
const generateTopicBasedQuestion = (topic: string): string | null => {
  // Skip topics that wouldn't make good questions
  if (topic.length < 4 || isCommonPhrase(topic)) {
    return null;
  }
  
  // Generate questions based on the topic
  const questions = [
    `How does ${topic} relate to what we discussed?`,
    `Can you tell me more about ${topic}?`,
    `What's important to understand about ${topic}?`,
    `How would you explain ${topic} to a beginner?`
  ];
  
  return questions[Math.floor(Math.random() * questions.length)];
};

// Determine the type of response to generate appropriate generic questions
const determineResponseType = (text: string): string => {
  if (text.includes('steps') || text.includes('procedure') || text.includes('how to')) {
    return 'instructional';
  } else if (text.includes('problem') || text.includes('issue') || text.includes('error')) {
    return 'troubleshooting';
  } else if (text.match(/\b(?:is|are|was|were)\b.*\b(?:defined as|refers to|means)\b/)) {
    return 'definition';
  } else if (text.match(/\d{4}|\b(?:history|past|evolution|development)\b/)) {
    return 'historical';
  } else if (text.match(/\b(?:compare|versus|vs\.|comparison|difference|similarities)\b/)) {
    return 'comparison';
  } else if (text.match(/\b(?:advantage|benefit|pro|con|drawback|downside)\b/)) {
    return 'evaluation';
  } else {
    return 'general';
  }
};

// Generate generic questions based on response type
const generateGenericQuestionsByType = (type: string): string[] => {
  switch (type) {
    case 'instructional':
      return [
        "What's the most common mistake people make with this process?",
        "Are there any shortcuts or alternatives to these steps?",
        "How can I tell if I'm doing this correctly?"
      ];
    case 'troubleshooting':
      return [
        "What preventive measures can I take to avoid this issue?",
        "Are there any other solutions I should consider?",
        "How can I diagnose this problem more effectively?"
      ];
    case 'definition':
      return [
        "Can you provide an example to illustrate this concept?",
        "How is this applied in real-world situations?",
        "What are the key components I should understand?"
      ];
    case 'historical':
      return [
        "How has this evolved over time?",
        "What were the key turning points in this history?",
        "How does the past influence current approaches?"
      ];
    case 'comparison':
      return [
        "Which option would you recommend for beginners?",
        "What factors should I prioritize in making this choice?",
        "Are there situations where the less popular option is better?"
      ];
    case 'evaluation':
      return [
        "How can I maximize these benefits?",
        "Are there ways to mitigate these drawbacks?",
        "How do these trade-offs compare to alternatives?"
      ];
    default:
      return [
        "Can you elaborate on this topic further?",
        "How can I learn more about this?",
        "What related topics would be valuable to explore?"
      ];
  }
};

// Helper to check if a word is a common word that wouldn't make a good topic
const isCommonWord = (word: string): boolean => {
  const commonWords = [
    'about', 'above', 'across', 'after', 'again', 'against', 'along', 'among',
    'around', 'because', 'before', 'behind', 'below', 'beneath', 'beside',
    'between', 'beyond', 'during', 'except', 'inside', 'outside', 'through',
    'toward', 'under', 'within', 'without', 'could', 'would', 'should', 'their',
    'other', 'another', 'which', 'there', 'these', 'those', 'since', 'while'
  ];
  
  return commonWords.includes(word.toLowerCase());
};

// Helper to check if a phrase is too common to be a good topic
const isCommonPhrase = (phrase: string): boolean => {
  const commonPhrases = [
    'this topic', 'this process', 'this method', 'this approach', 'the process',
    'the following', 'the above', 'the previous', 'the next step', 'the first step',
    'the last step', 'more information', 'further details', 'additional info',
    'to be sure', 'keep in mind', 'pay attention', 'don\'t forget', 'remember to'
  ];
  
  return commonPhrases.some(common => 
    phrase.toLowerCase() === common || 
    phrase.toLowerCase().includes(common)
  );
};

const ContinuationSuggestions: React.FC<ContinuationSuggestionsProps> = ({ 
  text, 
  onContinue, 
  isError 
}) => {
  const [continuationQuestions, setContinuationQuestions] = useState<string[]>([]);
  const { customization } = useSyndicate();
  
  // Extract continuation questions when text changes
  useEffect(() => {
    if (text && !isError && customization.showContinuationSuggestions) {
      const questions = extractContinuationQuestions(text);
      setContinuationQuestions(questions);
    } else {
      setContinuationQuestions([]);
    }
  }, [text, isError, customization.showContinuationSuggestions]);
  
  if (isError || continuationQuestions.length === 0 || !customization.showContinuationSuggestions) {
    return null;
  }
  
  return (
    <ContinuationButtons 
      suggestions={continuationQuestions}
      onContinue={onContinue}
    />
  );
};

export default ContinuationSuggestions;
