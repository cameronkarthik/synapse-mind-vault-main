
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';

interface ContinuationButtonsProps {
  suggestions: string[];
  onContinue: (question: string) => void;
}

const ContinuationButtons: React.FC<ContinuationButtonsProps> = ({ 
  suggestions, 
  onContinue 
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="default"
          size="sm"
          className="text-sm bg-synapse-purple hover:bg-synapse-purple/80 text-white font-medium py-2 px-4 shadow-md transition-all flex items-center justify-between"
          onClick={() => onContinue(suggestion)}
        >
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="line-clamp-1 text-left">{suggestion}</span>
          </div>
          <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
        </Button>
      ))}
    </div>
  );
};

export default ContinuationButtons;
