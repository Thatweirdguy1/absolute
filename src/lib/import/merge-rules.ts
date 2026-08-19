import { ParsedFile, ParsedRow } from './letterboxd-parser';

export interface MergedTitle {
  key: string; // normalized title + year
  title: string;
  year: number | null;
  letterboxdUri: string | null;
  watchEvents: MergedWatchEvent[];
  currentRating: number | null; // half-star int
  ratedDate: string | null;
  isOnWatchlist: boolean;
  watchlistAddedDate: string | null;
  reviews: MergedReview[];
  lists: { name: string; rank: number | null }[];
  sources: string[]; // which files contributed
}

export interface MergedWatchEvent {
  watchedDate: string | null;
  isRewatch: boolean;
  tags: string[];
  sourceFilename: string;
  sourceRow: number;
  checksum: string;
}

export interface MergedReview {
  text: string;
  date: string | null;
  rating: number | null;
  isRewatch: boolean;
}

export function mergeImportData(files: ParsedFile[]): MergedTitle[] {
  const mergedMap = new Map<string, MergedTitle>();

  const getTitleKey = (row: ParsedRow) => {
    if (row.normalized.letterboxdUri) return row.normalized.letterboxdUri;
    return `${row.normalized.title}|${row.normalized.year || 'unknown'}`;
  };

  const getOrInitTitle = (row: ParsedRow, purpose: string): MergedTitle => {
    const key = getTitleKey(row);
    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        key,
        title: row.normalized.title,
        year: row.normalized.year,
        letterboxdUri: row.normalized.letterboxdUri,
        watchEvents: [],
        currentRating: null,
        ratedDate: null,
        isOnWatchlist: false,
        watchlistAddedDate: null,
        reviews: [],
        lists: [],
        sources: []
      });
    }
    const t = mergedMap.get(key)!;
    if (!t.sources.includes(purpose)) {
      t.sources.push(purpose);
    }
    return t;
  };

  const processRows = (purpose: ParsedFile['purpose']) => {
    for (const file of files) {
      if (file.purpose !== purpose) continue;

      for (const row of file.rows) {
        const title = getOrInitTitle(row, file.purpose);

        if (purpose === 'watched') {
          // just ensures it's in the list
        } else if (purpose === 'ratings') {
          if (row.normalized.rating !== null && (title.ratedDate === null || (row.normalized.addedDate && title.ratedDate < row.normalized.addedDate))) {
            title.currentRating = row.normalized.rating;
            if (row.normalized.addedDate) title.ratedDate = row.normalized.addedDate;
          }
        } else if (purpose === 'watchlist') {
          title.isOnWatchlist = true;
          if (row.normalized.addedDate) title.watchlistAddedDate = row.normalized.addedDate;
        } else if (purpose === 'diary') {
          const isDup = title.watchEvents.some(we => we.checksum === row.checksum);
          if (!isDup) {
            title.watchEvents.push({
              watchedDate: row.normalized.watchedDate,
              isRewatch: row.normalized.isRewatch,
              tags: row.normalized.tags,
              sourceFilename: row.sourceFilename,
              sourceRow: row.sourceRowNumber,
              checksum: row.checksum
            });
          }
          if (row.normalized.rating !== null && (title.ratedDate === null || (row.normalized.watchedDate && title.ratedDate < row.normalized.watchedDate))) {
            title.currentRating = row.normalized.rating;
            title.ratedDate = row.normalized.watchedDate;
          }
        } else if (purpose === 'reviews') {
          if (row.normalized.reviewText) {
            title.reviews.push({
              text: row.normalized.reviewText,
              date: row.normalized.watchedDate || row.normalized.addedDate,
              rating: row.normalized.rating,
              isRewatch: row.normalized.isRewatch
            });
          }
        } else if (purpose === 'list') {
          if (row.normalized.listName) {
            title.lists.push({
              name: row.normalized.listName,
              rank: row.normalized.listRank
            });
          }
        }
      }
    }
  };

  processRows('watched');
  processRows('ratings');
  processRows('diary');
  processRows('watchlist');
  processRows('reviews');
  processRows('list');

  return Array.from(mergedMap.values());
}
