export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface Keyword {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
  profilePath?: string;
}

export interface Credit {
  id: string;
  personId: number;
  name: string;
  character?: string;
  job?: string;
  department?: string;
}

export interface Company {
  id: number;
  name: string;
  logoPath?: string;
  originCountry?: string;
}

export interface Media {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  status: string;
  originalLanguage: string;
  originCountries: string[];
  releaseDate: string | null;
  releaseYear: number | null;
  runtime: number | null;
  episodeRuntime: number[] | null;
  posterPath: string | null;
  backdropPath: string | null;
  popularity: number;
  tmdbVoteAverage: number;
  tmdbVoteCount: number;
  imdbId: string | null;
  metadataVersion: number;
  fetchedAt: string;
}

export interface WatchEvent {
  userId: string;
  mediaId: string;
  watchedDate: string;
  isRewatch: boolean;
  sourceType: string;
  sourceUri: string;
  importRowId: string | null;
  createdAt: string;
}

export interface UserRating {
  userId: string;
  mediaId: string;
  rating: number; // 1-10 (half-stars)
  source: string;
  ratedDate: string;
}

export interface ImportBatch {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImportRow {
  id: string;
  batchId: string;
  rawData: any;
  status: 'pending' | 'resolved' | 'unresolved' | 'failed';
  resolvedMediaId?: string;
  error?: string;
}

export type MatchConfidence = 'exact' | 'high' | 'medium' | 'low' | 'unmatched';
export type RatingSource = 'personal' | 'tmdb' | 'imdb' | 'community';

export interface WatchlistItem {
  userId: string;
  mediaId: string;
  addedAt: string;
}

export interface UserList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListItem {
  listId: string;
  mediaId: string;
  addedAt: string;
  order?: number;
}

export interface StatsScope {
  userId: string;
  dateRange: { start?: string; end?: string };
  mediaType?: MediaType;
  rewatchMode?: 'include' | 'exclude' | 'only';
  ratedFilter?: 'rated' | 'unrated' | 'all';
}

export interface StatResult<T> {
  value: T;
  denominator?: number;
  exclusions?: any[];
  completeness: number;
  calculationVersion: number;
}

export interface Profile {
  id: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  ratingScale: '10' | '5' | '100';
}

export interface ArchetypeScore {
  archetypeId: string;
  score: number;
}

export interface MoodTag {
  id: string;
  name: string;
  description?: string;
}

export interface ExternalRating {
  mediaId: string;
  source: RatingSource;
  rating: number;
  votes: number;
}
