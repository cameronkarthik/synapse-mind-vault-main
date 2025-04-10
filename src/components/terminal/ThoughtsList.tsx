import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Thought } from '@/contexts/types';
import ThoughtItem from './ThoughtItem';
import { useSyndicate } from '@/contexts/SynapseContext';

interface ThoughtsListProps {
  thoughts: Thought[];
  userProfile?: {
    name: string;
    avatarUrl?: string | null;
  };
  FormattedTextComponent?: React.ComponentType<{text: string}>;
  itemsPerPage?: number;
  currentPage?: number;
  bottomUp?: boolean; // New prop to determine display order
  shouldAutoScroll?: boolean;
  orderDescending?: boolean;
}

const ThoughtsList: React.FC<ThoughtsListProps> = ({ 
  thoughts, 
  userProfile, 
  FormattedTextComponent,
  itemsPerPage = 30, 
  currentPage = 1,
  bottomUp = false, // Default to top-down
  shouldAutoScroll = true,
  orderDescending = true,
}) => {
  const { userProfile: contextUserProfile } = useSyndicate();
  const listRef = useRef<HTMLDivElement>(null);

  // Use context userProfile if none is provided directly
  const effectiveUserProfile = userProfile || contextUserProfile || { name: 'User' };

  // Filter duplicate thoughts more efficiently with useMemo
  const filteredThoughts = useMemo(() => {
    const uniqueThoughts: Thought[] = [];
    const seenKeys = new Set<string>();
    
    // Keep thoughts with outputs, remove duplicates based on both content and timing
    thoughts.forEach((thought) => {
      // Create a unique key for this thought
      const key = `${thought.input?.trim()}-${thought.timestamp}`;
      
      // Check if we've seen this thought before or if this is a new one
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueThoughts.push(thought);
      } else if (thought.output && uniqueThoughts.find(t => 
        t.input?.trim() === thought.input?.trim() && 
        t.timestamp === thought.timestamp && 
        !t.output)) {
        // Replace the thought without output with the one with output
        const index = uniqueThoughts.findIndex(t => 
          t.input?.trim() === thought.input?.trim() && 
          t.timestamp === thought.timestamp);
        uniqueThoughts[index] = thought;
      }
    });

    // Apply ordering based on prop
    return orderDescending 
      ? uniqueThoughts.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
      : uniqueThoughts.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  }, [thoughts, orderDescending]);

  // Get paginated thoughts
  const paginatedThoughts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredThoughts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredThoughts, currentPage, itemsPerPage]);

  // Use useCallback for scroll handler to prevent recreation on each render
  const scrollToBottom = useCallback(() => {
    if (listRef.current && shouldAutoScroll) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [shouldAutoScroll]);

  // Auto-scroll when rendered thoughts change
  useEffect(() => {
    // Use requestAnimationFrame for smoother scrolling
    if (shouldAutoScroll) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [paginatedThoughts, scrollToBottom, shouldAutoScroll]);

  if (paginatedThoughts.length === 0) {
    return null;
  }
  
  // Render the thoughts list
  return (
    <div 
      ref={listRef} 
      className="thoughts-list w-full overflow-y-auto flex-1 pb-2" 
      data-thought-count={paginatedThoughts.length}
      data-bottom-up={bottomUp}
    >
      {/* When bottomUp is true, we want the oldest messages at the top */}
      {paginatedThoughts.map((thought, index) => (
        <ThoughtItem 
          key={`thought-${thought.timestamp}-${index}`} 
          thought={thought} 
          userProfile={effectiveUserProfile}
          FormattedTextComponent={FormattedTextComponent}
        />
      ))}
    </div>
  );
};

// Remove React.memo to ensure re-renders when thoughts array content changes
export default ThoughtsList;
