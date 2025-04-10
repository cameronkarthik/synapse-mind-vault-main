import React, { useEffect, useState, useRef, useLayoutEffect, memo } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import ThoughtsList from '@/components/terminal/ThoughtsList';
import NavigationMenu from '@/components/NavigationMenu';
import { Search, ChevronsLeft, ChevronsRight, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Memoize the ThoughtsList component to prevent unnecessary re-renders
const MemoizedThoughtsList = memo(ThoughtsList);

const History = () => {
  const { allThoughts, userProfile, searchThoughts } = useSyndicate();
  const thoughtsContainerRef = useRef<HTMLDivElement>(null);
  const isPageTransitioning = useRef<boolean>(false);
  const isFirstRender = useRef<boolean>(true);
  
  const [filteredThoughts, setFilteredThoughts] = useState(allThoughts || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  
  const ITEMS_PER_PAGE = 10;
  
  // Scroll to top when component mounts and set optimal spacing
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    
    // Set optimal spacing for history page content
    const historyContainer = document.querySelector('.history-container');
    if (historyContainer) {
      const viewportHeight = window.innerHeight;
      // Reduced top spacing to show more content initially
      const topSpacing = Math.max(16, Math.floor(viewportHeight * 0.05));
      
      // Apply spacing
      (historyContainer as HTMLElement).style.paddingTop = `${topSpacing}px`;
    }
  }, []);
  
  useEffect(() => {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log("History page rendering with thoughts:", allThoughts?.length || 0);
    }
    
    // Sort thoughts from oldest to newest for bottom-up display
    const sortedThoughts = [...(allThoughts || [])].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    setFilteredThoughts(sortedThoughts);
  }, [allThoughts]);
  
  // Calculate pagination information
  const totalPages = Math.ceil((filteredThoughts?.length || 0) / ITEMS_PER_PAGE);

  // Get reference to the important DOM elements
  const getElements = () => {
    const container = document.querySelector('.terminal-output-container');
    const paginationBottom = document.querySelector('.pagination-container');
    const paginationTop = document.querySelector('.pagination-container-top');
    return { container, paginationBottom, paginationTop };
  };
  
  // Get current page thoughts
  const getCurrentPageThoughts = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredThoughts.slice(startIndex, endIndex);
  };
  
  // Scroll to the bottom of the page
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'auto'
      });
    });
  };
  
  // Add scroll event listener to detect user scrolling
  useEffect(() => {
    const handleScroll = () => {
      // If it's not a programmatic scroll (during page transitions), consider it a user action
      if (!isPageTransitioning.current) {
        setUserHasScrolled(true);
      }
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Show button if not near the bottom of the page
      const isNearBottom = scrollPosition + windowHeight >= docHeight - 200;
      setShowScrollButton(!isNearBottom);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Effect to scroll to bottom only on initial load or page changes
  useEffect(() => {
    // Don't auto-scroll if user has manually scrolled, unless it's a page change
    const isPageChange = !isFirstRender.current;
    
    if (isPageChange || !userHasScrolled) {
      scrollToBottom();
    }
    
    // After initial render, mark it as no longer first render
    isFirstRender.current = false;
  }, [currentPage, filteredThoughts]);
  
  // Reset user scroll state when changing pages
  useEffect(() => {
    setUserHasScrolled(false);
  }, [currentPage]);
  
  // Handle page changes with improved performance
  const goToPage = (page: number) => {
    // Skip if we're already on this page
    if (page === currentPage || page < 1 || page > totalPages) return;
    
    // Start transition process
    isPageTransitioning.current = true;
    
    requestAnimationFrame(() => {
      setCurrentPage(page);
      // Reset user scroll state when changing pages
      setUserHasScrolled(false);
      isPageTransitioning.current = false;
    });
  };
  
  // Handle search with optimized performance
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Sort thoughts from oldest to newest when resetting search
      const sortedThoughts = [...(allThoughts || [])].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      setFilteredThoughts(sortedThoughts);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchThoughts(searchQuery);
      // Sort search results from oldest to newest
      const sortedResults = [...results].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setFilteredThoughts(sortedResults);
      setCurrentPage(1); // Reset to first page after search
      
      // Don't need to scroll here as the useEffect will handle it
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search reset
  const handleReset = () => {
    setSearchQuery('');
    
    // Sort thoughts from oldest to newest when resetting search
    const sortedThoughts = [...(allThoughts || [])].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    setFilteredThoughts(sortedThoughts);
    setCurrentPage(1);
    
    // Don't need to scroll here as the useEffect will handle it
  };
  
  // Ensure more compact layout for better visibility
  const renderCompactPaginationItems = () => {
    if (totalPages <= 1) return null;
    
    const items = [];
    
    // More compact pagination that shows fewer items but is more visible
    if (currentPage > 1) {
      items.push(
        <PaginationItem key="prev">
          <PaginationLink
            onClick={() => goToPage(currentPage - 1)}
            className="cursor-pointer text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800"
          >
            {currentPage - 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    items.push(
      <PaginationItem key={currentPage}>
        <PaginationLink
          isActive={true}
          className="bg-zinc-800 text-white cursor-pointer"
        >
          {currentPage}
        </PaginationLink>
      </PaginationItem>
    );
    
    if (currentPage < totalPages) {
      items.push(
        <PaginationItem key="next">
          <PaginationLink
            onClick={() => goToPage(currentPage + 1)}
            className="cursor-pointer text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800"
          >
            {currentPage + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  // Create a unified pagination component for both top and bottom
  const renderPagination = () => {
    return (
      <Pagination className="justify-center">
        <PaginationContent className="flex items-center gap-2">
          {currentPage > 1 && (
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => goToPage(1)}
                className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white mr-1"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
          )}
          
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => goToPage(currentPage - 1)}
                className="cursor-pointer text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800 mr-1"
              />
            </PaginationItem>
          )}
          
          {renderCompactPaginationItems()}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext 
                onClick={() => goToPage(currentPage + 1)}
                className="cursor-pointer text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800 ml-1"
              />
            </PaginationItem>
          )}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => goToPage(totalPages)}
                className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    );
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-black pt-16">
      <NavigationMenu />
      
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full history-container">
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-white mb-3">Thought History</h1>
          
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search your thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 w-full"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearching ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-zinc-500 rounded-full animate-spin"></div>
                ) : null}
              </div>
            </div>
            
            <Button 
              onClick={handleSearch}
              className="bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            
            {searchQuery && (
              <Button 
                onClick={handleReset}
                variant="outline"
                className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
        
        {filteredThoughts && filteredThoughts.length > 0 ? (
          <>
            <div className="pagination-container-top mb-2 flex items-center justify-between">
              <div className="text-zinc-500 text-sm whitespace-nowrap">
                {filteredThoughts.length} thoughts · Page {currentPage} of {totalPages}
              </div>
              <div className="flex-1 mx-4">
                {renderPagination()}
              </div>
              <div className="w-24"></div> {/* Spacer to balance the layout */}
            </div>
            
            <div ref={thoughtsContainerRef} className="terminal-output-container page-transition-container bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-2">
              <MemoizedThoughtsList 
                thoughts={getCurrentPageThoughts()} 
                userProfile={userProfile}
                bottomUp={true}
              />
            </div>
            
            <div className="pagination-container py-2 sticky bottom-0 bg-black/80 backdrop-blur-sm z-10">
              {renderPagination()}
            </div>
            
            <div className="h-1 w-full" ref={(el) => {
              if (el && !isPageTransitioning.current && !userHasScrolled) {
                scrollToBottom();
              }
            }}></div>
          </>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            {searchQuery ? 
              'No thoughts found matching your search.' : 
              'No thoughts found. Start a conversation to create thoughts.'}
          </div>
        )}
      </div>
      
      {/* Add a floating scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-4 z-20 bg-zinc-800 text-white rounded-full p-3 shadow-lg hover:bg-zinc-700 transition-all"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default History;
