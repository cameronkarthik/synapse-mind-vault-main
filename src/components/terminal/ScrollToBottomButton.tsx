import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ onClick }) => {
  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="fixed bottom-4 right-4 rounded-full w-10 h-10 bg-syndicate-dark border border-gray-700 hover:bg-gray-800 shadow-lg z-10"
      onClick={onClick}
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="h-5 w-5 text-gray-300" />
    </Button>
  );
};

export default ScrollToBottomButton;
