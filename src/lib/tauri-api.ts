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

export interface DashboardStats {
  total_films: number;
  total_hours: number;
  avg_rating: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    return await invoke<DashboardStats>('get_dashboard_stats');
  } catch (error) {
    console.error('Failed to get dashboard stats:', error);
    return { total_films: 0, total_hours: 0, avg_rating: 0 };
  }
}

export async function checkTmdbToken(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_tmdb_token');
  } catch (error) {
    console.error('Failed to check token:', error);
    return false;
  }
}

export async function saveTmdbToken(token: string): Promise<boolean> {
  return await invoke<boolean>('save_tmdb_token_command', { token });
}

export async function importLetterboxdCsv(filePath: string): Promise<number> {
  try {
    return await invoke<number>('import_letterboxd_csv', { filePath });
  } catch (error) {
    console.error('Failed to import CSV:', error);
    throw error;
  }
}



