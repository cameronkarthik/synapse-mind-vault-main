import React, { useEffect, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Palette, Save } from 'lucide-react';

interface CustomizationSettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CustomizationSettings: React.FC<CustomizationSettingsProps> = ({ open: propOpen, onOpenChange }) => {
  const { customization, updateCustomization } = useSyndicate();
  const [open, setOpen] = useState(propOpen || false);
  
  useEffect(() => {
    // Handle open state from props if present
    if (propOpen !== undefined) {
      setOpen(propOpen);
    }
  }, [propOpen]);
  
  useEffect(() => {
    // Setup the event listener for the custom trigger
    const handleTriggerClick = () => setOpen(true);
    const triggerElement = document.getElementById('customization-trigger');
    if (triggerElement) {
      triggerElement.addEventListener('click', handleTriggerClick);
    }
    
    return () => {
      if (triggerElement) {
        triggerElement.removeEventListener('click', handleTriggerClick);
      }
    };
  }, []);
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };
  
  const handleDisplayTagsChange = (checked: boolean) => {
    updateCustomization({ displayTags: checked });
  };
  
  const handleShowContinuationSuggestionsChange = (checked: boolean) => {
    updateCustomization({ showContinuationSuggestions: checked });
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-synapse-dark border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5 text-zinc-400" />
            Customization
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-left">
            Personalize your Syndicate Mind experience with these customization options.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white" htmlFor="display-tags">Display Tagging</Label>
              <p className="text-gray-400 text-xs mt-1">
                Show hashtags under each conversation. Tags are still created regardless of this setting.
              </p>
            </div>
            <Switch 
              id="display-tags"
              checked={customization.displayTags}
              onCheckedChange={handleDisplayTagsChange}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-800"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white" htmlFor="show-suggestions">Show Continuation Suggestions</Label>
              <p className="text-gray-400 text-xs mt-1">
                Show 3 suggested follow-up questions after each AI response.
              </p>
            </div>
            <Switch 
              id="show-suggestions"
              checked={customization.showContinuationSuggestions}
              onCheckedChange={handleShowContinuationSuggestionsChange}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-800"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={() => handleOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizationSettings;
