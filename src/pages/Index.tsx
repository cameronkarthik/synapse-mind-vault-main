import React, { useEffect, useRef } from 'react';
import Terminal from '@/components/Terminal';
import NavigationMenu from '@/components/NavigationMenu';
import { useSyndicate } from '@/contexts/SynapseContext';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  console.log("Rendering Index page");
  const pageRef = useRef<HTMLDivElement>(null);
  const { apiKey } = useSyndicate();
  
  // Ensure page starts at the top when navigating to this route and calculate ideal spacing
  useEffect(() => {
    // Scroll to top immediately
    window.scrollTo(0, 0);
    
    // Set ideal vertical spacing based on viewport height
    const setIdealSpacing = () => {
      if (pageRef.current) {
        const viewportHeight = window.innerHeight;
        // Calculate ideal top padding using golden ratio principles
        // We want the terminal to be positioned at a visually pleasing height
        const navHeight = 56; // Approximate height of the navigation bar
        const topSpacing = Math.max(20, Math.floor(viewportHeight * 0.1));
        
        // Apply the spacing to the container
        pageRef.current.style.paddingTop = `${topSpacing}px`;
        
        // Store measurements for debugging if needed
        pageRef.current.dataset.viewportHeight = `${viewportHeight}`;
        pageRef.current.dataset.calculatedTopSpacing = `${topSpacing}`;
      }
    };
    
    // Set spacing on initial load
    setIdealSpacing();
    
    // Adjust on window resize
    window.addEventListener('resize', setIdealSpacing);
    return () => window.removeEventListener('resize', setIdealSpacing);
  }, []);
  
  return (
    <div className="min-h-screen bg-black flex flex-col pt-16" ref={pageRef}>
      <NavigationMenu />
      
      <div className="flex-1 flex flex-col justify-start items-center max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <Terminal />
      </div>
      
      <footer className="text-center text-zinc-600 text-xs px-4 pb-4 mt-8">
        <p>All your thoughts and memories are stored locally in your browser. Your API key is never sent to our servers.</p>
      </footer>
      <Toaster />
    </div>
  );
};

export default Index;
