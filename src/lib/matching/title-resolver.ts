import { TMDBProvider, TMDBSearchResult } from './tmdb';

export interface MatchCandidate {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  originalTitle: string;
  releaseYear: number | null;
  posterPath: string | null;
  overview: string;
  popularity: number;
  confidence: number; // 0-1
  matchReasons: string[];
}

export interface MatchResult {
  status: 'exact' | 'high' | 'medium' | 'low' | 'unmatched';
  candidates: MatchCandidate[];
  selectedCandidate: MatchCandidate | null;
  autoAccepted: boolean;
}

function stringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  
  if (a === b) return 1.0;

  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + indicator // substitution
      );
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLength = Math.max(a.length, b.length);
  
  return (maxLength - distance) / maxLength;
}

function extractYear(dateString?: string): number | null {
  if (!dateString) return null;
  const year = parseInt(dateString.split('-')[0], 10);
  return isNaN(year) ? null : year;
}

export async function resolveTitles(
  titles: { title: string; year: number | null; letterboxdUri?: string | null }[],
  tmdb: TMDBProvider
): Promise<MatchResult[]> {
  const results: MatchResult[] = [];

  for (const item of titles) {
    const candidates: MatchCandidate[] = [];
    
    try {
      // 1. Search TMDB with title
      const searchRes = await tmdb.searchMulti(item.title);
      
      // Filter out people, we only want movie/tv
      const mediaResults = searchRes.filter(r => r.media_type === 'movie' || r.media_type === 'tv');

      for (const res of mediaResults) {
        let confidence = 0;
        const matchReasons: string[] = [];
        
        const resTitle = (res.media_type === 'movie' ? res.title : res.name) || '';
        const resOriginalTitle = (res.media_type === 'movie' ? res.original_title : res.original_name) || '';
        const resYear = extractYear(res.media_type === 'movie' ? res.release_date : res.first_air_date);
        
        const similarity = stringSimilarity(item.title, resTitle);
        const originalSimilarity = stringSimilarity(item.title, resOriginalTitle);

        // Scoring logic
        if (similarity === 1.0) {
          confidence += 0.4;
          matchReasons.push('Exact title match');
        } else if (similarity > 0.8) {
          confidence += 0.3;
          matchReasons.push(`Fuzzy title match (${(similarity * 100).toFixed(0)}%)`);
        }

        if (originalSimilarity > 0.9 && similarity !== 1.0) {
          confidence += 0.2;
          matchReasons.push('Original title match');
        }

        if (item.year && resYear) {
          if (item.year === resYear) {
            confidence += 0.2;
            matchReasons.push('Exact year match');
          } else if (Math.abs(item.year - resYear) <= 1) {
            confidence += 0.1;
            matchReasons.push('Year within 1');
          }
        }
        
        const popularity = res.popularity || 0;
        if (popularity > 0) {
          confidence += 0.05 * (Math.log(popularity) / 10);
          matchReasons.push('Popularity score');
        }

        candidates.push({
          tmdbId: res.id,
          mediaType: res.media_type as 'movie' | 'tv',
          title: resTitle,
          originalTitle: resOriginalTitle,
          releaseYear: resYear,
          posterPath: res.poster_path || null,
          overview: res.overview || '',
          popularity,
          confidence: Math.min(confidence, 1.0),
          matchReasons
        });
      }

      // Sort candidates by confidence, then popularity
      candidates.sort((a, b) => b.confidence - a.confidence || b.popularity - a.popularity);

      let selectedCandidate: MatchCandidate | null = null;
      let autoAccepted = false;
      let status: MatchResult['status'] = 'unmatched';

      if (candidates.length > 0) {
        const top = candidates[0];
        const gap = candidates.length > 1 ? top.confidence - candidates[1].confidence : 1.0;

        if (top.confidence > 0.7 && gap > 0.15) {
          selectedCandidate = top;
          autoAccepted = true;
        }

        if (top.confidence > 0.7) status = 'exact';
        else if (top.confidence > 0.5) status = 'high';
        else if (top.confidence > 0.3) status = 'medium';
        else if (top.confidence > 0.1) status = 'low';
      }

      results.push({
        status,
        candidates,
        selectedCandidate,
        autoAccepted
      });
      
    } catch (error) {
      console.error(`Error resolving title "${item.title}":`, error);
      results.push({
        status: 'unmatched',
        candidates: [],
        selectedCandidate: null,
        autoAccepted: false
      });
    }
  }

  return results;
}
