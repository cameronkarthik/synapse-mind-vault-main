
import { UserProfile } from './types';

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  avatarUrl: null
};

export const hashApiKey = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

export const loadUserProfile = (apiKey: string): UserProfile => {
  if (!apiKey) return DEFAULT_PROFILE;
  
  const profileKey = `synapse-profile-${hashApiKey(apiKey)}`;
  const savedProfile = localStorage.getItem(profileKey);
  
  if (savedProfile) {
    try {
      const parsedProfile = JSON.parse(savedProfile);
      return {...DEFAULT_PROFILE, ...parsedProfile};
    } catch (error) {
      console.error('Error parsing user profile:', error);
      return DEFAULT_PROFILE;
    }
  } else {
    return DEFAULT_PROFILE;
  }
};

export const saveUserProfile = (
  apiKey: string, 
  profile: UserProfile, 
  toastFn: (title: string, description: string) => void
): void => {
  if (!apiKey) return;
  
  const profileKey = `synapse-profile-${hashApiKey(apiKey)}`;
  localStorage.setItem(profileKey, JSON.stringify(profile));
  
  toastFn("Profile Updated", "Your profile has been updated successfully.");
};
