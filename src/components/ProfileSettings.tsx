import React, { useState, useRef, useEffect } from 'react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileSettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ open: propOpen, onOpenChange }) => {
  const { userProfile, updateUserProfile } = useSyndicate();
  const [name, setName] = useState(userProfile.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(userProfile.avatarUrl);
  const [open, setOpen] = useState(propOpen || false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Handle open state from props if present
    if (propOpen !== undefined) {
      setOpen(propOpen);
    }
  }, [propOpen]);
  
  useEffect(() => {
    // Setup the event listener for the custom trigger
    const handleTriggerClick = () => setOpen(true);
    const triggerElement = document.getElementById('profile-settings-trigger');
    if (triggerElement) {
      triggerElement.addEventListener('click', handleTriggerClick);
    }
    
    return () => {
      if (triggerElement) {
        triggerElement.removeEventListener('click', handleTriggerClick);
      }
    };
  }, []);
  
  useEffect(() => {
    setName(userProfile.name);
    setPreviewImage(userProfile.avatarUrl);
  }, [userProfile]);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!e.target.value.trim()) {
      setNameError('Display name is required');
    } else {
      setNameError(null);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSave = () => {
    if (!name.trim()) {
      setNameError('Display name is required');
      toast({
        title: "Cannot Save",
        description: "Please enter a display name",
        variant: "destructive"
      });
      return;
    }
    
    updateUserProfile({
      name: name.trim(),
      avatarUrl: previewImage
    });
    handleOpenChange(false);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-synapse-dark border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <UserRound className="h-5 w-5 text-zinc-400" />
            Profile Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-left">
            Customize your personal profile settings for Syndicate Mind.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 cursor-pointer" onClick={triggerFileInput}>
              {previewImage ? (
                <AvatarImage src={previewImage} alt={name || "Profile"} />
              ) : (
                <AvatarFallback className="bg-blue-600 text-white text-2xl">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={triggerFileInput}
            >
              <span className="text-white text-sm">Change</span>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
          </div>
          
          <div className="w-full space-y-2">
            <label htmlFor="displayName" className="text-white text-sm">Display Name</label>
            <Input
              id="displayName"
              value={name}
              onChange={handleNameChange}
              className={`bg-gray-800 border-gray-700 text-white ${nameError ? 'border-red-500' : ''}`}
              placeholder="Your display name"
              required
            />
            {nameError && (
              <p className="text-red-500 text-xs mt-1">{nameError}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            disabled={!name.trim()}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettings;
