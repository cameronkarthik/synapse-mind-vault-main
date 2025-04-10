
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface ScrollToBottomButtonProps {
  showScrollButton: boolean;
  scrollToBottom: () => void;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ 
  showScrollButton, 
  scrollToBottom 
}) => {
  if (!showScrollButton) {
    return null;
  }

  return (
    <Button
      onClick={scrollToBottom}
      className="fixed bottom-8 right-8 bg-syndicate-purple hover:bg-syndicate-blue text-white rounded-full p-2 z-10"
      size="icon"
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
};

export default ScrollToBottomButton;
