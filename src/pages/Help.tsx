import React, { useEffect, useRef } from 'react';
import NavigationMenu from '@/components/NavigationMenu';
import HelpAccordion from '@/components/HelpAccordion';
import { Lightbulb, BookOpen, Terminal as TerminalIcon, Info } from 'lucide-react';

const Help = () => {
  const helpContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top when component mounts and set optimal spacing
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    
    // Set optimal spacing for help page content
    const setOptimalSpacing = () => {
      if (helpContainerRef.current) {
        const viewportHeight = window.innerHeight;
        const topSpacing = Math.max(24, Math.floor(viewportHeight * 0.075));
        
        // Apply spacing
        helpContainerRef.current.style.paddingTop = `${topSpacing}px`;
      }
    };
    
    // Set spacing initially
    setOptimalSpacing();
    
    // Update on resize
    window.addEventListener('resize', setOptimalSpacing);
    return () => window.removeEventListener('resize', setOptimalSpacing);
  }, []);
  
  return (
    <div className="min-h-screen bg-black flex flex-col pt-16">
      <NavigationMenu />
      
      <div ref={helpContainerRef} className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Help Center</h1>
          <p className="text-zinc-500">Learn how to get the most out of Syndicate Mind</p>
        </div>
        
        <div className="space-y-8 pb-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="text-zinc-400" size={20} />
              <span>Understanding Syndicate Mind</span>
            </h2>
            <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4">
              <HelpAccordion />
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TerminalIcon className="text-zinc-400" size={20} />
              <span>Available Commands</span>
            </h2>
            <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4">
              <table className="w-full text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="py-2 text-left text-zinc-300 font-medium">Command</th>
                    <th className="py-2 text-left text-zinc-300 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/recall #tag</td>
                    <td className="py-2">Search thoughts by tag</td>
                  </tr>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/recall keyword</td>
                    <td className="py-2">Search thoughts by keyword</td>
                  </tr>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/recall recent</td>
                    <td className="py-2">Show recent thoughts</td>
                  </tr>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/tag tagname content</td>
                    <td className="py-2">Save a thought with a specific tag</td>
                  </tr>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/journal content</td>
                    <td className="py-2">Save a journal entry</td>
                  </tr>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/note content</td>
                    <td className="py-2">Save a quick note</td>
                  </tr>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/summarize last 7 days</td>
                    <td className="py-2">Summarize thoughts from the last 7 days</td>
                  </tr>
                  <tr className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-zinc-400">/summarize last 1 week</td>
                    <td className="py-2">Summarize thoughts from the last week</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-zinc-400">/summarize last 1 month</td>
                    <td className="py-2">Summarize thoughts from the last month</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-4 text-zinc-500 text-sm">You can also use hashtags directly in your input (#tag) to add tags.</p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Info className="text-zinc-400" size={20} />
              <span>Tips for Getting Started</span>
            </h2>
            <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-4 text-zinc-300 space-y-4">
              <div>
                <h3 className="font-medium text-white mb-1">Start with daily journaling</h3>
                <p className="text-zinc-400">Begin by recording your thoughts, ideas, and reflections each day using the /journal command.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-1">Use tags consistently</h3>
                <p className="text-zinc-400">Create a tagging system that works for you - by project, theme, or concept - to easily retrieve related thoughts.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-1">Ask questions</h3>
                <p className="text-zinc-400">Don't just record statements - ask questions to your future self that you can revisit and answer later.</p>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-1">Perform regular reviews</h3>
                <p className="text-zinc-400">Use the summarize commands periodically to review what you've been thinking about and identify patterns.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Help; 