
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Thought } from '@/contexts/types';

interface HistoryCollapsibleProps {
  olderThoughts: Thought[];
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  userProfile: {
    name: string;
    avatarUrl?: string | null;
  };
}

const HistoryCollapsible: React.FC<HistoryCollapsibleProps> = ({
  olderThoughts,
}) => {
  const navigate = useNavigate();
  
  if (olderThoughts.length === 0) {
    return null;
  }

  const handleViewHistory = () => {
    navigate('/history');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center justify-center gap-2 bg-syndicate-dark border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 mx-auto"
      onClick={handleViewHistory}
    >
      <History className="h-4 w-4" />
      View Message History ({olderThoughts.length})
    </Button>
  );
};

export default HistoryCollapsible;
