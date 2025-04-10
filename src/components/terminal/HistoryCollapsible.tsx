import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Thought } from '@/contexts/types';

interface HistoryCollapsibleProps {
  allThoughts: Thought[];
  recentCount: number;
  FormattedTextComponent?: React.ComponentType<{text: string}>;
}

const HistoryCollapsible: React.FC<HistoryCollapsibleProps> = ({
  allThoughts,
  recentCount
}) => {
  const navigate = useNavigate();
  
  // Calculate how many older thoughts we have
  const olderThoughtsCount = Math.max(0, allThoughts.length - recentCount);
  
  if (olderThoughtsCount === 0) {
    return null;
  }

  const handleViewHistory = () => {
    navigate('/history');
  };

  return (
    <div className="my-4 flex flex-col items-center">
      <div className="border-t border-gray-800 w-full mb-4"></div>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center justify-center gap-2 bg-syndicate-dark border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 mx-auto"
        onClick={handleViewHistory}
      >
        <History className="h-4 w-4" />
        View {olderThoughtsCount} more message{olderThoughtsCount !== 1 ? 's' : ''} in history
      </Button>
    </div>
  );
};

export default HistoryCollapsible;
