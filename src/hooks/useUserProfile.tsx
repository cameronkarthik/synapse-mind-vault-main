import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/contexts/types';
import { loadUserProfile, saveUserProfile } from '@/contexts/profileUtils';
import { useToast } from '@/hooks/use-toast';

export const useUserProfile = (apiKey: string) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: 'User', avatarUrl: null });
  const toastObj = useToast();

  useEffect(() => {
    if (apiKey) {
      const profile = loadUserProfile(apiKey);
      setUserProfile(profile);
    }
  }, [apiKey]);

  const updateUserProfile = useCallback(async (profile: Partial<UserProfile>): Promise<void> => {
    if (!apiKey) {
      console.warn("Attempted to update profile without API key");
      return; // Exit if no API key
    }
    
    const newProfile = {...userProfile, ...profile};
    setUserProfile(newProfile);
    
    // Assuming saveUserProfile is potentially async or can be made async
    // Even if saveUserProfile is sync, wrapping in async satisfies the type
    try {
      await saveUserProfile(apiKey, newProfile, (title, description) => {
        toastObj.toast({
          title,
          description,
        });
      });
      console.log("User profile saved successfully");
    } catch (error) {
      console.error("Failed to save user profile:", error);
      // Optionally show an error toast here
    }
  }, [apiKey, userProfile, toastObj]);

  return {
    userProfile,
    updateUserProfile
  };
};
