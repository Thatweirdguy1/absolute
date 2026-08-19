import { Media } from '@/types';

export interface YearReview {
  year: number;
  totalWatchEvents: number;
  uniqueTitles: number;
  totalMinutes: number;
  newDiscoveries: number;
  rewatchEvents: number;
  topFilms: { media: Media; rating: number | null }[];
  topGenres: { genre: string; count: number }[];
  topDirectors: { name: string; count: number }[];
  monthlyActivity: { month: number; count: number }[];
  decadeSpread: { decade: number; count: number }[];
  averageRating: number | null;
  longestStreak: number; // consecutive days
  busiestMonth: { month: number; count: number };
  countriesExplored: number;
  languagesExplored: number;
}

export interface CinematicFingerprint {
  topGenres: string[];
  topDecades: string[];
  topCountries: string[];
  avgRating: number;
  totalWatched: number;
  totalHours: number;
  tasteStatement: string; // deterministic, e.g. 'A devoted fan of 2010s psychological thrillers with a soft spot for Korean cinema'
  dominantMood: string;
}
