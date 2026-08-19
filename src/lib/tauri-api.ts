import { invoke } from '@tauri-apps/api/core';

export interface Profile {
  id: string;
  display_name: string;
  username?: string;
  avatar_path?: string;
  timezone?: string;
  onboarding_state: string;
}

export async function getProfile(): Promise<Profile | null> {
  try {
    return await invoke<Profile | null>('get_profile');
  } catch (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
}

export async function createProfile(displayName: string): Promise<Profile> {
  return await invoke<Profile>('create_profile', { displayName });
}
