import { cache } from 'react';

// Types
export interface TMDBSearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string; // movies
  name?: string; // tv
  original_title?: string;
  original_name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  original_language?: string;
  origin_country?: string[];
}

export interface TMDBCreditPerson {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  known_for_department: string;
  character?: string;
  department?: string;
  job?: string;
  order?: number;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCreditPerson[];
  crew: TMDBCreditPerson[];
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  status: string;
  original_language: string;
  origin_country: string[];
  release_date: string;
  runtime: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  imdb_id?: string;
  budget?: number;
  revenue?: number;
  tagline?: string;
  keywords?: { keywords: { id: number; name: string }[] };
  credits?: TMDBCredits;
  external_ids?: {
    imdb_id: string | null;
  };
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  status: string;
  original_language: string;
  origin_country: string[];
  first_air_date: string;
  last_air_date: string;
  number_of_episodes: number;
  number_of_seasons: number;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  tagline?: string;
  keywords?: { results: { id: number; name: string }[] };
  credits?: TMDBCredits;
  external_ids?: {
    imdb_id: string | null;
  };
}

export interface TMDBImageConfig {
  base_url: string;
  secure_base_url: string;
  backdrop_sizes: string[];
  logo_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
  still_sizes: string[];
}

class TokenBucket {
  private capacity: number;
  private tokens: number;
  private fillRate: number; // tokens per ms
  private lastFilled: number;

  constructor(capacity: number, fillRatePerMs: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.fillRate = fillRatePerMs;
    this.lastFilled = Date.now();
  }

  async consume(count = 1): Promise<void> {
    while (true) {
      this.refill();
      if (this.tokens >= count) {
        this.tokens -= count;
        return;
      }
      const waitTime = Math.ceil((count - this.tokens) / this.fillRate);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastFilled;
    const newTokens = elapsed * this.fillRate;
    if (newTokens > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + newTokens);
      this.lastFilled = now;
    }
  }
}

export class TMDBProvider {
  private readToken: string;
  private baseUrl = 'https://api.themoviedb.org/3';
  private rateLimiter: TokenBucket;
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private cache: Map<string, { data: any; expires: number }> = new Map();

  constructor(readToken: string) {
    this.readToken = readToken;
    // TMDB allows ~40 requests per 10 seconds. We'll be slightly conservative.
    this.rateLimiter = new TokenBucket(40, 40 / 10000);
  }

  private async fetchWithRetry<T>(url: string, params: Record<string, string> = {}, cacheTtlMs: number = 86400000): Promise<T> {
    const query = new URLSearchParams(params).toString();
    const fullUrl = `${this.baseUrl}${url}${query ? `?${query}` : ''}`;

    // Check cache
    const cached = this.cache.get(fullUrl);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Request deduplication
    if (this.inFlightRequests.has(fullUrl)) {
      return this.inFlightRequests.get(fullUrl);
    }

    const requestPromise = this.executeRequest<T>(fullUrl, cacheTtlMs);
    this.inFlightRequests.set(fullUrl, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.inFlightRequests.delete(fullUrl);
    }
  }

  private async executeRequest<T>(fullUrl: string, cacheTtlMs: number, attempt: number = 1): Promise<T> {
    await this.rateLimiter.consume(1);

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${this.readToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429 && attempt <= 3) {
          const retryAfter = response.headers.get('Retry-After');
          let waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          waitTime += Math.random() * 500; // Jitter
          await new Promise(r => setTimeout(r, waitTime));
          return this.executeRequest(fullUrl, cacheTtlMs, attempt + 1);
        }
        throw new Error(`TMDB API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(fullUrl, { data, expires: Date.now() + cacheTtlMs });
      
      return data;
    } catch (error) {
      if (attempt <= 3) {
        const waitTime = Math.pow(2, attempt) * 1000 + (Math.random() * 500);
        await new Promise(r => setTimeout(r, waitTime));
        return this.executeRequest(fullUrl, cacheTtlMs, attempt + 1);
      }
      throw error;
    }
  }

  async searchMulti(query: string, year?: number): Promise<TMDBSearchResult[]> {
    const params: Record<string, string> = { query, include_adult: 'false' };
    if (year) params.primary_release_year = year.toString(); // For movies, tv uses first_air_date_year but multi search is tricky
    const res = await this.fetchWithRetry<{ results: TMDBSearchResult[] }>('/search/multi', params, 3600000);
    return res.results;
  }

  async searchMovies(query: string, year?: number): Promise<TMDBSearchResult[]> {
    const params: Record<string, string> = { query, include_adult: 'false' };
    if (year) params.primary_release_year = year.toString();
    const res = await this.fetchWithRetry<{ results: TMDBSearchResult[] }>('/search/movie', params, 3600000);
    return res.results.map(r => ({ ...r, media_type: 'movie' }));
  }

  async searchTV(query: string, year?: number): Promise<TMDBSearchResult[]> {
    const params: Record<string, string> = { query, include_adult: 'false' };
    if (year) params.first_air_date_year = year.toString();
    const res = await this.fetchWithRetry<{ results: TMDBSearchResult[] }>('/search/tv', params, 3600000);
    return res.results.map(r => ({ ...r, media_type: 'tv' }));
  }

  async getMovieDetail(id: number): Promise<TMDBMovieDetail> {
    return this.fetchWithRetry<TMDBMovieDetail>(`/movie/${id}`, { append_to_response: 'credits,external_ids,keywords' });
  }

  async getTVDetail(id: number): Promise<TMDBTVDetail> {
    return this.fetchWithRetry<TMDBTVDetail>(`/tv/${id}`, { append_to_response: 'credits,external_ids,keywords' });
  }

  async getExternalIds(id: number, type: 'movie' | 'tv'): Promise<{ imdb_id?: string }> {
    return this.fetchWithRetry<{ imdb_id?: string }>(`/${type}/${id}/external_ids`);
  }

  async getCredits(id: number, type: 'movie' | 'tv'): Promise<TMDBCredits> {
    return this.fetchWithRetry<TMDBCredits>(`/${type}/${id}/credits`);
  }

  async getKeywords(id: number, type: 'movie' | 'tv'): Promise<{ id: number; name: string }[]> {
    const endpoint = type === 'movie' ? `/movie/${id}/keywords` : `/tv/${id}/keywords`;
    const data = await this.fetchWithRetry<any>(endpoint);
    return type === 'movie' ? data.keywords : data.results;
  }

  async getImageConfig(): Promise<TMDBImageConfig> {
    const data = await this.fetchWithRetry<{ images: TMDBImageConfig }>('/configuration', {}, 7 * 86400000);
    return data.images;
  }
}
