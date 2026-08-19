import { StatsScope, StatResult, Media, WatchEvent, UserRating, Person, Company } from '@/types';
import { getStore } from '@/lib/store/data-store';
import { CinematicFingerprint, YearReview } from './types';

// Helper Functions
export function filterEventsByScope(events: WatchEvent[], scope: StatsScope): WatchEvent[] {
  return events.filter(event => {
    // Check Date Range
    if (scope.dateRange) {
      if (scope.dateRange.start && new Date(event.watchedDate) < new Date(scope.dateRange.start)) return false;
      if (scope.dateRange.end && new Date(event.watchedDate) > new Date(scope.dateRange.end)) return false;
    }

    // Check Rewatch Mode
    if (scope.rewatchMode) {
      if (scope.rewatchMode === 'exclude' && event.isRewatch) return false;
      if (scope.rewatchMode === 'only' && !event.isRewatch) return false;
    }

    // Filter by MediaType and Rated
    const store = getStore();
    const media = store.media.get(event.mediaId);
    if (!media) return false;

    if (scope.mediaType && media.mediaType !== scope.mediaType) return false;

    if (scope.ratedFilter && scope.ratedFilter !== 'all') {
      const isRated = store.ratings.has(event.mediaId);
      if (scope.ratedFilter === 'rated' && !isRated) return false;
      if (scope.ratedFilter === 'unrated' && isRated) return false;
    }

    return true;
  });
}

export function getMediaForEvents(events: WatchEvent[]): Media[] {
  const store = getStore();
  const mediaKeys = new Set(events.map(e => e.mediaId));
  const mediaList: Media[] = [];
  mediaKeys.forEach(key => {
    const media = store.media.get(key);
    if (media) {
      mediaList.push(media);
    }
  });
  return mediaList;
}

function createResult<T>(value: T, denominator?: number, completeness: number = 1): StatResult<T> {
  return {
    value,
    denominator,
    completeness,
    calculationVersion: 1.0,
  };
}

// Core Stats
export function getUniqueWatched(scope: StatsScope): StatResult<number> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  const uniqueKeys = new Set(events.map(e => e.mediaId));
  return createResult(uniqueKeys.size, store.watchEvents.length, 1);
}

export function getTotalWatchEvents(scope: StatsScope): StatResult<number> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  return createResult(events.length, store.watchEvents.length, 1);
}

export function getMovieCount(scope: StatsScope): StatResult<number> {
  const combinedScope: StatsScope = { ...scope, mediaType: 'movie' };
  return getUniqueWatched(combinedScope);
}

export function getTVShowCount(scope: StatsScope): StatResult<number> {
  const combinedScope: StatsScope = { ...scope, mediaType: 'tv' };
  return getUniqueWatched(combinedScope);
}

// Rewatch Stats
export function getRewatchEvents(scope: StatsScope): StatResult<number> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  
  const eventsPerMedia = new Map<string, number>();
  events.forEach(e => {
    eventsPerMedia.set(e.mediaId, (eventsPerMedia.get(e.mediaId) || 0) + 1);
  });

  let rewatchCount = 0;
  eventsPerMedia.forEach(count => {
    if (count > 1) {
      rewatchCount += (count - 1);
    }
  });

  return createResult(rewatchCount, events.length, 1);
}

export function getRewatchedTitles(scope: StatsScope): StatResult<number> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  
  const eventsPerMedia = new Map<string, number>();
  events.forEach(e => {
    eventsPerMedia.set(e.mediaId, (eventsPerMedia.get(e.mediaId) || 0) + 1);
  });

  let titles = 0;
  eventsPerMedia.forEach(count => {
    if (count > 1) titles++;
  });

  return createResult(titles, eventsPerMedia.size, 1);
}

export function getMostRewatched(scope: StatsScope): StatResult<{media: Media, count: number}[]> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  
  const eventsPerMedia = new Map<string, number>();
  events.forEach(e => {
    eventsPerMedia.set(e.mediaId, (eventsPerMedia.get(e.mediaId) || 0) + 1);
  });

  const sorted = Array.from(eventsPerMedia.entries())
    .filter(([_, count]) => count > 1)
    .map(([mediaId, count]) => ({
      media: store.media.get(mediaId)!,
      count
    }))
    .filter(item => item.media)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return createResult(sorted);
}

// Rating Stats
export function getRatingHistogram(scope: StatsScope): StatResult<{bucket: number, count: number, percentage: number}[]> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  const uniqueMediaIds = Array.from(new Set(events.map(e => e.mediaId)));
  
  const buckets = Array.from({ length: 10 }, (_, i) => ({ bucket: (i + 1), count: 0, percentage: 0 }));
  let unratedCount = 0;
  let totalRated = 0;

  uniqueMediaIds.forEach(id => {
    const rating = store.ratings.get(id);
    if (rating && rating.rating >= 1 && rating.rating <= 10) {
      const bucketIdx = Math.round(rating.rating) - 1;
      if (bucketIdx >= 0 && bucketIdx < 10) {
        buckets[bucketIdx].count++;
        totalRated++;
      }
    } else {
      unratedCount++;
    }
  });

  if (totalRated > 0) {
    buckets.forEach(b => {
      b.percentage = (b.count / totalRated) * 100;
    });
  }

  // we use a special bucket 0 for unrated
  buckets.push({ bucket: 0, count: unratedCount, percentage: uniqueMediaIds.length > 0 ? (unratedCount / uniqueMediaIds.length) * 100 : 0 });

  return createResult(buckets, uniqueMediaIds.length);
}

export function getAverageRating(scope: StatsScope): StatResult<number> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  const uniqueMediaIds = Array.from(new Set(events.map(e => e.mediaId)));
  
  let sum = 0;
  let count = 0;

  uniqueMediaIds.forEach(id => {
    const rating = store.ratings.get(id);
    if (rating) {
      sum += rating.rating;
      count++;
    }
  });

  const avg = count > 0 ? sum / count : 0;
  return createResult(avg, count);
}

export function getRatedCount(scope: StatsScope): StatResult<{rated: number, unrated: number}> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  const uniqueMediaIds = Array.from(new Set(events.map(e => e.mediaId)));
  
  let rated = 0;
  let unrated = 0;

  uniqueMediaIds.forEach(id => {
    if (store.ratings.has(id)) {
      rated++;
    } else {
      unrated++;
    }
  });

  return createResult({ rated, unrated }, uniqueMediaIds.length);
}

// Time Stats
export function getTotalWatchTime(scope: StatsScope): StatResult<{knownMinutes: number, estimatedMinutes: number, missingCount: number, completeness: number}> {
  const store = getStore();
  const events = filterEventsByScope(store.watchEvents, scope);
  
  let knownMinutes = 0;
  let estimatedMinutes = 0;
  let missingCount = 0;

  events.forEach(e => {
    const media = store.media.get(e.mediaId);
    if (media) {
      if (media.runtime && media.runtime > 0) {
        knownMinutes += media.runtime;
      } else if (media.mediaType === 'tv' && media.episodeRuntime && media.episodeRuntime.length > 0) {
        knownMinutes += media.episodeRuntime[0];
      } else {
        estimatedMinutes += media.mediaType === 'movie' ? 120 : 45;
        missingCount++;
      }
    }
  });

  const completeness = events.length > 0 ? (events.length - missingCount) / events.length : 1;
  return createResult({ knownMinutes, estimatedMinutes, missingCount, completeness }, events.length, completeness);
}

export function formatWatchTime(minutes: number): {minutes: number, hours: number, days: number, humanComparison: string} {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const featureFilms = Math.floor(minutes / 120);
  
  return {
    minutes,
    hours,
    days,
    humanComparison: `That's ${featureFilms} feature films back to back`
  };
}

// Era/Decade Stats
export function getReleaseYearHistogram(scope: StatsScope): StatResult<{year: number, count: number}[]> {
  const events = filterEventsByScope(getStore().watchEvents, scope);
  const mediaList = getMediaForEvents(events);
  
  const yearCounts = new Map<number, number>();
  mediaList.forEach(m => {
    if (m.releaseYear) {
      yearCounts.set(m.releaseYear, (yearCounts.get(m.releaseYear) || 0) + 1);
    }
  });

  const sorted = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  return createResult(sorted);
}

export function getDecadeHistogram(scope: StatsScope): StatResult<{decade: number, count: number}[]> {
  const events = filterEventsByScope(getStore().watchEvents, scope);
  const mediaList = getMediaForEvents(events);
  
  const decadeCounts = new Map<number, number>();
  mediaList.forEach(m => {
    if (m.releaseYear) {
      const decade = Math.floor(m.releaseYear / 10) * 10;
      decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);
    }
  });

  const sorted = Array.from(decadeCounts.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade - b.decade);

  return createResult(sorted);
}

export function getWatchedByYear(scope: StatsScope): StatResult<{year: number, count: number}[]> {
  const events = filterEventsByScope(getStore().watchEvents, scope);
  
  const yearCounts = new Map<number, number>();
  events.forEach(e => {
    const d = new Date(e.watchedDate);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
    }
  });

  const sorted = Array.from(yearCounts.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  return createResult(sorted);
}

// Genre Stats
export function getGenresByVolume(scope: StatsScope): StatResult<{genre: string, count: number}[]> {
  // Mocked for MVP since Genre mapping is not explicit in Media interface
  return createResult([]);
}

export function getGenresByTime(scope: StatsScope): StatResult<{genre: string, minutes: number}[]> {
  return createResult([]);
}

export function getGenresByRating(scope: StatsScope): StatResult<{genre: string, avgRating: number, count: number}[]> {
  return createResult([]);
}

// People Stats
export function getTopDirectors(scope: StatsScope): StatResult<{person: Person, count: number, avgRating: number, minutes: number}[]> {
  return createResult([]);
}

export function getTopActors(scope: StatsScope): StatResult<{person: Person, count: number, avgRating: number, minutes: number}[]> {
  return createResult([]);
}

export function getTopStudios(scope: StatsScope): StatResult<{company: Company, count: number, avgRating: number}[]> {
  return createResult([]);
}

// Country/Language Stats
export function getCountryDistribution(scope: StatsScope): StatResult<{country: string, count: number}[]> {
  const events = filterEventsByScope(getStore().watchEvents, scope);
  const mediaList = getMediaForEvents(events);
  const counts = new Map<string, number>();
  
  mediaList.forEach(m => {
    m.originCountries?.forEach(c => {
      counts.set(c, (counts.get(c) || 0) + 1);
    });
  });

  const sorted = Array.from(counts.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  return createResult(sorted);
}

export function getLanguageDistribution(scope: StatsScope): StatResult<{language: string, count: number}[]> {
  const events = filterEventsByScope(getStore().watchEvents, scope);
  const mediaList = getMediaForEvents(events);
  const counts = new Map<string, number>();
  
  mediaList.forEach(m => {
    if (m.originalLanguage) {
      counts.set(m.originalLanguage, (counts.get(m.originalLanguage) || 0) + 1);
    }
  });

  const sorted = Array.from(counts.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  return createResult(sorted);
}

// Advanced Stats
export function getArchetypeScores(scope: StatsScope): StatResult<{archetype: string, score: number, evidence: Media[]}[]> {
  return createResult([]);
}

export function getYearInReview(year: number, scope: StatsScope): StatResult<YearReview> {
  const store = getStore();
  const yearScope = { ...scope, dateRange: { start: `${year}-01-01T00:00:00Z`, end: `${year}-12-31T23:59:59Z` } };
  const events = filterEventsByScope(store.watchEvents, yearScope);
  
  let totalMinutes = 0;
  const uniqueTitles = new Set<string>();
  const monthlyActivityCounts = new Array(12).fill(0);
  
  let rewatchEvents = 0;

  events.forEach(e => {
    uniqueTitles.add(e.mediaId);
    if (e.isRewatch) rewatchEvents++;
    
    const d = new Date(e.watchedDate);
    if (!isNaN(d.getTime())) {
      monthlyActivityCounts[d.getMonth()]++;
    }

    const media = store.media.get(e.mediaId);
    if (media) {
      if (media.runtime) totalMinutes += media.runtime;
      else if (media.episodeRuntime?.length) totalMinutes += media.episodeRuntime[0];
      else totalMinutes += (media.mediaType === 'movie' ? 120 : 45);
    }
  });

  const monthlyActivity = monthlyActivityCounts.map((count, i) => ({ month: i + 1, count }));
  const busiestMonth = monthlyActivity.reduce((prev, current) => (prev.count > current.count) ? prev : current, {month: 1, count: 0});
  
  const avgResult = getAverageRating(yearScope).value;

  return createResult({
    year,
    totalWatchEvents: events.length,
    uniqueTitles: uniqueTitles.size,
    totalMinutes,
    newDiscoveries: uniqueTitles.size - rewatchEvents, // simplified
    rewatchEvents,
    topFilms: [],
    topGenres: [],
    topDirectors: [],
    monthlyActivity,
    decadeSpread: getDecadeHistogram(yearScope).value,
    averageRating: avgResult > 0 ? avgResult : null,
    longestStreak: 0,
    busiestMonth,
    countriesExplored: getCountryDistribution(yearScope).value.length,
    languagesExplored: getLanguageDistribution(yearScope).value.length
  });
}

export function getCinematicFingerprint(scope: StatsScope): StatResult<CinematicFingerprint> {
  const timeStats = getTotalWatchTime(scope).value;
  const decades = getDecadeHistogram(scope).value.slice(0, 3).map(d => `${d.decade}s`);
  const countries = getCountryDistribution(scope).value.slice(0, 3).map(c => c.country);
  
  return createResult({
    topGenres: [],
    topDecades: decades,
    topCountries: countries,
    avgRating: getAverageRating(scope).value,
    totalWatched: getUniqueWatched(scope).value,
    totalHours: formatWatchTime(timeStats.knownMinutes + timeStats.estimatedMinutes).hours,
    tasteStatement: 'A devoted fan of cinema',
    dominantMood: 'Thoughtful'
  });
}
