import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Key, LogIn } from 'lucide-react';
import { useSyndicate } from '@/contexts/SynapseContext';
import { useToast } from '@/hooks/use-toast';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const apiKeySchema = z.object({
  apiKey: z.string()
    .min(3, { message: "API Key is required" })
    .refine((val) => val.startsWith('sk-'), {
      message: "API Key must start with 'sk-'"
    })
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface ApiKeyDialogProps {
  standalone?: boolean;
  open?: boolean; 
  setOpen?: (open: boolean) => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ 
  standalone = false,
  open: propOpen,
  setOpen: propSetOpen
}) => {
  const { apiKey, setApiKey } = useSyndicate();
  const [internalOpen, setInternalOpen] = useState(propOpen || false);
  const { toast } = useToast();

  // Use the prop setter if available, otherwise use internal state
  const setOpenState = (newOpen: boolean) => {
    if (propSetOpen) {
      propSetOpen(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };
  
  // Use the prop open value if available, otherwise use internal state
  const openState = propOpen !== undefined ? propOpen : internalOpen;

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: apiKey || '',
    },
  });

  useEffect(() => {
    // Update form when apiKey changes
    if (apiKey) {
      form.setValue('apiKey', apiKey);
    }
    
    // Setup the event listener for our custom trigger
    const handleTriggerClick = () => setOpenState(true);
    const triggerElement = document.getElementById('api-key-trigger');
    if (triggerElement) {
      triggerElement.addEventListener('click', handleTriggerClick);
    }
    
    return () => {
      if (triggerElement) {
        triggerElement.removeEventListener('click', handleTriggerClick);
      }
    };
  }, [apiKey, form]);

  const handleSave = (values: ApiKeyFormValues) => {
    setApiKey(values.apiKey);
    setOpenState(false);
    toast({
      title: apiKey ? "API Key Updated" : "Login Successful",
      description: apiKey 
        ? "Your OpenAI API key has been updated for this session." 
        : "You've successfully logged in to Synapse.",
    });
  };

  // For standalone mode (when used on the login screen)
  if (standalone) {
    return (
      <div className="w-full max-w-md mx-auto bg-synapse-dark border border-gray-700 rounded-lg p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-center">
          <Key className="h-10 w-10 text-synapse-purple mr-3" />
          <h2 className="text-xl font-bold gradient-text">Login with OpenAI API Key</h2>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">API Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="sk-..."
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    Your key is stored locally and never sent to our servers.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit"
              disabled={!form.formState.isValid}
              className="w-full bg-synapse-purple hover:bg-synapse-blue text-white"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {apiKey ? "Update API Key" : "Login to Synapse"}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  // Regular dialog mode (for settings)
  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogContent className="bg-synapse-dark text-white border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-xl font-semibold">
            <Key className="h-5 w-5 text-zinc-400" />
            OpenAI API Key
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-left">
            Enter your OpenAI API key to use GPT-4 and Whisper for voice transcription.
            Your key is stored locally and never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">API Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="sk-..."
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={!form.formState.isValid}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Save API Key
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
