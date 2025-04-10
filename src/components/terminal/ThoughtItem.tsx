import React, { useRef, useEffect, memo } from 'react';
import { Thought } from '@/contexts/types';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FormattedOutput from './FormattedOutput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSyndicate } from '@/contexts/SynapseContext';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface ThoughtItemProps {
  thought: Thought;
  userProfile: {
    name: string;
    avatarUrl?: string | null;
  };
  FormattedTextComponent?: React.ComponentType<{text: string}>;
}

const ThoughtItem: React.FC<ThoughtItemProps> = ({ 
  thought, 
  userProfile, 
  FormattedTextComponent 
}) => {
  const date = new Date(thought.timestamp);
  const thoughtRef = useRef<HTMLDivElement>(null);
  const { customization } = useSyndicate();
  
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log("ThoughtItem rendering:", { 
      timestamp: thought.timestamp,
      hasInput: !!thought.input,
      hasOutput: !!thought.output,
      inputLength: thought.input?.length || 0,
      outputLength: thought.output?.length || 0,
      displayTags: customization.displayTags
    });
  }
  
  useEffect(() => {
    if (thoughtRef.current && process.env.NODE_ENV === 'development') {
      console.log(`ThoughtItem mounted/updated: ${thought.input?.substring(0, 20)}`);
    }
  }, [thought]);
  
  // Check if the input appears to be a table
  const hasTableFormat = thought.input?.includes('|') && thought.input?.includes('\n|');
  
  return (
    <div 
      className="mb-6" 
      id={`thought-${thought.timestamp}`} 
      ref={thoughtRef} 
      data-has-output={!!thought.output}
    >
      <div className="flex items-start mb-2">
        <Avatar className="flex-shrink-0 w-8 h-8">
          {userProfile.avatarUrl ? (
            <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
          ) : (
            <AvatarFallback className="bg-syndicate-purple text-white flex items-center justify-center font-semibold">
              {userProfile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="ml-2 flex-1">
          <div className="flex items-center">
            <HoverCard>
              <HoverCardTrigger>
                <span className="font-semibold text-gray-300 cursor-help">
                  {userProfile.name}
                </span>
              </HoverCardTrigger>
              <HoverCardContent side="top" align="start" className="w-auto p-2 text-xs bg-gray-800 text-gray-300 border-gray-700">
                {formatDate(date)}
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="mt-1 text-white terminal-text">
            {hasTableFormat ? (
              <div className="overflow-x-auto bg-gray-900 p-2 rounded my-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {thought.input.split('\n')[0].split('|').filter(Boolean).map((header, i) => (
                        <TableHead key={i} className="border-b border-gray-700">{header.trim()}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {thought.input.split('\n').slice(2).filter(line => line.includes('|')).map((row, i) => (
                      <TableRow key={i}>
                        {row.split('|').filter(Boolean).map((cell, j) => (
                          <TableCell key={j} className="border-b border-gray-800">{cell.trim()}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : FormattedTextComponent ? (
              <FormattedTextComponent text={thought.input} />
            ) : (
              thought.input
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-start ml-10">
        <Avatar className="flex-shrink-0 w-8 h-8">
          <AvatarImage src="/lovable-uploads/8740abf8-b295-4c95-aed1-4e57c533403a.png" alt="Syndicate" />
          <AvatarFallback className="bg-syndicate-blue text-white flex items-center justify-center font-semibold">
            S
          </AvatarFallback>
        </Avatar>
        <div className="ml-2 flex-1">
          <div className="flex items-center">
            <HoverCard>
              <HoverCardTrigger>
                <span className="font-semibold gradient-text cursor-help">
                  Syndicate
                </span>
              </HoverCardTrigger>
              <HoverCardContent side="top" align="start" className="w-auto p-2 text-xs bg-gray-800 text-gray-300 border-gray-700">
                {formatDate(date)}
              </HoverCardContent>
            </HoverCard>
          </div>
          <div className="mt-1 text-gray-200 terminal-text output-container">
            <FormattedOutput text={thought.output} thoughtId={thought.timestamp} />
          </div>
          {thought.tags && thought.tags.length > 0 && customization.displayTags && (
            <div className="mt-2 flex flex-wrap gap-1">
              {thought.tags.map((tag, tagIndex) => (
                <span 
                  key={tagIndex}
                  className="text-xs px-2 py-1 rounded-full bg-syndicate-dark border border-syndicate-purple text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ThoughtItem, (prevProps, nextProps) => {
  // Compare the important properties to determine if re-render is needed
  const prevThought = prevProps.thought;
  const nextThought = nextProps.thought;
  
  // Only re-render if anything meaningful changed
  const isSameInput = prevThought.input === nextThought.input;
  const isSameOutput = prevThought.output === nextThought.output;
  const isSameTimestamp = prevThought.timestamp === nextThought.timestamp;
  const isSameTags = 
    (!prevThought.tags && !nextThought.tags) ||
    (prevThought.tags?.length === nextThought.tags?.length && 
     prevThought.tags?.every((tag, i) => tag === nextThought.tags?.[i]));
  
  const isSameUserProfile = 
    prevProps.userProfile.name === nextProps.userProfile.name &&
    prevProps.userProfile.avatarUrl === nextProps.userProfile.avatarUrl;
  
  // Return true if nothing changed (skip re-render)
  return isSameInput && isSameOutput && isSameTimestamp && isSameTags && isSameUserProfile;
});
