import React, { useRef, useEffect, memo } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { extractChartData } from '@/lib/utils';
import ContinuationSuggestions from './output/ContinuationSuggestions';
import ErrorFeedback from './output/ErrorFeedback';
import TextFormatter from './output/TextFormatter';

interface FormattedOutputProps {
  text: string;
  thoughtId?: string;
}

interface FormattedTextProps {
  text: string;
}

// Helper function to check if the content is markdown
const isMarkdown = (text: string): boolean => {
  return /^#|\n#|^\s*-|\n\s*-|\`.*\`|##/.test(text);
};

// A simpler version of FormattedOutput for use in lists
export const FormattedText = memo(({ text }: FormattedTextProps) => {
  if (!text) return null;
  
  if (isMarkdown(text)) {
    return <TextFormatter text={text} />;
  }
  
  return <div className="whitespace-pre-wrap">{text}</div>;
});

const FormattedOutput: React.FC<FormattedOutputProps> = ({ text, thoughtId }) => {
  const outputRef = useRef<HTMLDivElement>(null);
  const { handleInput } = useSyndicate();
  
  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    console.log("FormattedOutput rendering with text:", text ? `length: ${text.length}` : "empty");
  }
  
  // Effect to scroll output into view when text updates
  useEffect(() => {
    if (text && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [text]);
  
  const handleContinue = (question: string) => {
    if (handleInput) {
      handleInput(question);
    } else {
      console.error("handleInput function not available");
    }
  };
  
  // Simplified logic: If no text, show waiting.
  if (!text) {
    return (
      <div className="text-yellow-500 italic py-1 min-h-[20px] animate-pulse" ref={outputRef} data-thought-id={thoughtId}>
        Waiting for response...
      </div>
    );
  }
  
  // If text exists, proceed to render the content
  // Check for error messages and style them accordingly
  const isError = text.startsWith('Error:');
  const isLongInputError = isError && (
    text.includes('timed out') || 
    text.includes('maximum context length') ||
    text.includes('too large') ||
    text.includes('long input')
  );
  
  // Extract code blocks before markdown processing
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  // Check for chart data
  const chartData = extractChartData(text);
  const hasCharts = chartData.length > 0;
  
  // Check if text looks like markdown format
  const hasMarkdownFormatting = isMarkdown(text);
  
  return (
    <div 
      ref={outputRef} 
      className={`formatted-output ${isError ? 'text-yellow-500' : ''}`}
      style={{ 
        minHeight: '20px',
        display: 'block',
        visibility: 'visible'
      }}
      data-has-content="true"
      data-is-error={isError}
      data-is-long-input-error={isLongInputError}
      data-thought-id={thoughtId}
    >
      <ErrorFeedback 
        isError={isError} 
        isLongInputError={isLongInputError} 
        text={text} 
      />

      <TextFormatter text={text} />
      
      <ContinuationSuggestions
        text={text}
        onContinue={handleContinue}
        isError={isError}
      />
    </div>
  );
};

export default FormattedOutput;
