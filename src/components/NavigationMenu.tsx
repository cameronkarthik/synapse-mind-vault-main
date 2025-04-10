import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, History, Settings, Palette, UserRound, LogOut, Key, HelpCircle, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyndicate } from '@/contexts/SynapseContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ApiKeyDialog from './ApiKeyDialog';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import CustomizationSettings from './CustomizationSettings';
import ProfileSettings from './ProfileSettings';

export const NavigationMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { apiKey, userProfile, logout, hideChatHistory, setHideChatHistory, clearChatHistory } = useSyndicate();
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const handleApiKeyClick = () => {
    console.log("API Key settings clicked");
    document.getElementById('api-key-trigger')?.click();
  };

  const handleProfileSettingsClick = () => {
    // We'll need to implement this functionality to open profile settings
    console.log("Profile settings clicked");
    document.getElementById('profile-settings-trigger')?.click();
  };
  
  const handleCustomizationClick = () => {
    // We'll need to implement this functionality to open customization settings
    console.log("Customization settings clicked");
    document.getElementById('customization-trigger')?.click();
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out? This will clear your API key from local storage.')) {
      logout();
    }
  };
  
  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear your chat? This cannot be undone.')) {
      clearChatHistory();
    }
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 border-b border-zinc-800 bg-black py-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo - Left Side */}
          <div className="w-40">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <Terminal className="h-4 w-4 text-white" />
              </div>
              <span className="font-mono text-md text-white">Syndicate Mind</span>
            </Link>
          </div>
          
          {/* Navigation - Center */}
          <Menubar className="bg-transparent border-none flex items-center justify-center">
            <MenubarMenu>
              <MenubarTrigger 
                className={`px-3 ${location.pathname === '/' ? 'text-white' : 'text-zinc-400'}`}
              >
                <Link to="/" className="flex items-center space-x-1">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            <MenubarMenu>
              <MenubarTrigger 
                className={`px-3 ${location.pathname === '/history' ? 'text-white' : 'text-zinc-400'}`}
              >
                <Link to="/history" className="flex items-center space-x-1">
                  <History className="h-4 w-4" />
                  <span>History</span>
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            <MenubarMenu>
              <MenubarTrigger 
                className={`px-3 ${location.pathname === '/help' ? 'text-white' : 'text-zinc-400'}`}
              >
                <Link to="/help" className="flex items-center space-x-1">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
            
            <MenubarMenu>
              <MenubarTrigger className="px-3 text-zinc-400">
                <div className="flex items-center space-x-1">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </div>
              </MenubarTrigger>
              <MenubarContent className="bg-zinc-950 text-white border-zinc-800 rounded-md">
                <MenubarItem onClick={() => setApiKeyDialogOpen(true)} className="hover:bg-zinc-900 hover:text-white cursor-pointer">
                  {apiKey ? 'Change API Key' : 'Add API Key'}
                </MenubarItem>
                
                <MenubarItem onClick={() => setCustomizationOpen(true)} className="hover:bg-zinc-900 hover:text-white cursor-pointer">
                  UI Preferences
                </MenubarItem>
                
                <MenubarItem onClick={() => setProfileOpen(true)} className="hover:bg-zinc-900 hover:text-white cursor-pointer">
                  Profile Settings
                </MenubarItem>
                
                <MenubarSeparator className="bg-zinc-800" />
                
                <MenubarItem onClick={() => setHideChatHistory(!hideChatHistory)} className="hover:bg-zinc-900 hover:text-white cursor-pointer">
                  {hideChatHistory ? 'Show Chat History' : 'Hide Chat History'}
                </MenubarItem>
                
                <MenubarItem onClick={handleClearChat} className="hover:bg-zinc-900 hover:text-white cursor-pointer">
                  Clear Chat
                </MenubarItem>
                
                <MenubarSeparator className="bg-zinc-800" />
                
                <MenubarItem onClick={handleLogout} className="text-red-400 hover:bg-zinc-900 hover:text-red-300 cursor-pointer">
                  Logout
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          
          {/* User Profile - Right Side */}
          <div className="w-40 flex justify-end">
            <div className="h-8 w-8 rounded-full overflow-hidden">
              <Avatar>
                {userProfile?.avatarUrl ? (
                  <AvatarImage src={userProfile.avatarUrl} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm">
                    <div className="flex items-center justify-center w-full h-full">
                      {userProfile?.name && userProfile.name.trim() !== '' 
                        ? userProfile.name.charAt(0).toUpperCase() 
                        : 'U'}
                    </div>
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </div>
        </div>
      </div>
      
      <ApiKeyDialog open={apiKeyDialogOpen} setOpen={setApiKeyDialogOpen} />
      <CustomizationSettings open={customizationOpen} onOpenChange={setCustomizationOpen} />
      <ProfileSettings open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
};

export default NavigationMenu;
