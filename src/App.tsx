import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { SyndicateProvider } from "@/contexts/SynapseContext";
import ApiKeyDialog from "@/components/ApiKeyDialog";
import ProfileSettings from "@/components/ProfileSettings";
import CustomizationSettings from "@/components/CustomizationSettings";
import Routes from "./Routes";

const App = () => {
  // Create a new QueryClient instance inside the component
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SyndicateProvider>
          <BrowserRouter>
            {/* Add global dialog triggers */}
            <span id="api-key-trigger" className="hidden"></span>
            <span id="profile-settings-trigger" className="hidden"></span>
            <span id="customization-trigger" className="hidden"></span>
            
            {/* Add global dialogs */}
            <ApiKeyDialog />
            <ProfileSettings />
            <CustomizationSettings />
            
            <Routes />
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </SyndicateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
