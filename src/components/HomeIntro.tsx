import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Terminal, Code, Hash, BarChart3, ArrowDown } from "lucide-react";

const HomeIntro: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Apply optimized spacing for better content visibility
  useEffect(() => {
    const setIdealSpacing = () => {
      if (containerRef.current) {
        // Calculate spacing based on viewport
        const viewportHeight = window.innerHeight;
        const phi = 1.618; // Golden ratio
        // Reduced top margin to show more content initially
        const idealTopMargin = Math.floor(viewportHeight / phi / 3.5);
        
        containerRef.current.style.marginTop = `${Math.min(idealTopMargin, 50)}px`;
        containerRef.current.style.marginBottom = `${Math.min(idealTopMargin / 2, 30)}px`;
      }
    };
    
    setIdealSpacing();
    window.addEventListener('resize', setIdealSpacing);
    return () => window.removeEventListener('resize', setIdealSpacing);
  }, []);
  
  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center px-4 space-y-4 w-full max-w-3xl mx-auto transition-all duration-300">
      <div className="flex flex-col items-center space-y-2 mb-2">
        <div className="h-14 w-14 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-lg">
          <Terminal className="h-7 w-7 text-white" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-white">
          Syndicate <span className="text-zinc-400">Mind</span>
        </h1>
        
        <p className="text-zinc-400 text-center text-base sm:text-lg max-w-xl">
          Your expanded consciousness and digital memory system
        </p>
      </div>
      
      <Separator className="w-full max-w-md bg-zinc-800" />
      
      <Card className="w-full border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="font-mono text-white text-lg sm:text-xl">How to use your second brain</CardTitle>
          <CardDescription>Enhance your thinking with these simple commands</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CommandCard 
              icon={<Code className="h-5 w-5 text-zinc-400" />}
              title="Journal daily" 
              description="Record thoughts, discoveries, and observations"
              command="Just type anything"
              highlight={true}
            />
            
            <CommandCard 
              icon={<Hash className="h-5 w-5 text-zinc-400" />}
              title="Tag memories" 
              description="Organize your thoughts with tags"
              command="#project #idea #research"
            />
            
            <CommandCard 
              icon={<Terminal className="h-5 w-5 text-zinc-400" />}
              title="Recall information" 
              description="Access memories by tag or keyword"
              command="/recall #tag or keyword"
            />
            
            <CommandCard 
              icon={<BarChart3 className="h-5 w-5 text-zinc-400" />}
              title="Get insights" 
              description="Generate summaries from past thoughts"
              command="/summarize last 7 days"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t border-zinc-800 flex flex-col space-y-2 pt-3 pb-3">
          <div className="flex items-center space-x-2 text-xs text-zinc-500">
            <Badge variant="outline" className="text-xs bg-transparent border-zinc-700 text-zinc-400">
              Tip
            </Badge>
            <span>All your thoughts and memories are stored locally in your browser</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-zinc-500">
            <Badge variant="outline" className="text-xs bg-transparent border-zinc-700 text-zinc-400">
              Pro
            </Badge>
            <span>Upload text files and images to enhance your memory system</span>
          </div>
        </CardFooter>
      </Card>
      
      <div className="flex flex-col items-center justify-center gap-1 mt-2 animate-pulse">
        <p className="text-zinc-500 text-sm font-medium">Type a message below to begin</p>
        <ArrowDown className="h-4 w-4 text-zinc-500" />
      </div>
    </div>
  );
};

interface CommandCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  command: string;
  highlight?: boolean;
}

const CommandCard: React.FC<CommandCardProps> = ({ icon, title, description, command, highlight }) => {
  return (
    <div className={`border ${highlight ? 'border-zinc-700' : 'border-zinc-800'} rounded-lg p-3 
      ${highlight ? 'bg-black/40 ring-1 ring-zinc-700/50' : 'bg-black/20'} 
      hover:bg-black/30 transition-all duration-300 ${highlight ? 'transform hover:-translate-y-1' : ''}`}>
      <div className="flex items-start space-x-3">
        <div className="mt-0.5">
          {icon}
        </div>
        <div>
          <h3 className={`${highlight ? 'text-white font-semibold' : 'text-white font-medium'} text-sm sm:text-base`}>{title}</h3>
          <p className="text-zinc-500 text-xs sm:text-sm">{description}</p>
          <code className={`mt-1 inline-block px-2 py-1 rounded ${highlight ? 'bg-zinc-900/80 text-zinc-200' : 'bg-black/30 text-zinc-300'} text-xs font-mono`}>
            {command}
          </code>
        </div>
      </div>
    </div>
  );
};

export default HomeIntro; 