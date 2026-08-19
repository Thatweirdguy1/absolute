'use client';

import { Media, WatchEvent, UserRating, WatchlistItem, ImportBatch, Genre, Credit, Person, Company } from '@/types';

export interface StoreStats {
  mediaCount: number;
  watchEventCount: number;
  ratingCount: number;
  watchlistCount: number;
}

export interface ExportBundle {
  version: string;
  exportedAt: string;
  data: {
    media: [string, Media][];
    watchEvents: WatchEvent[];
    ratings: [string, UserRating][];
    watchlist: WatchlistItem[];
    importBatches: ImportBatch[];
    genres: Genre[];
    credits: Credit[];
    people: [number, Person][];
    companies: [number, Company][];
  };
}

export interface DataStore {
  media: Map<string, Media>;
  watchEvents: WatchEvent[];
  ratings: Map<string, UserRating>;
  watchlist: WatchlistItem[];
  importBatches: ImportBatch[];
  genres: Genre[];
  credits: Credit[];
  people: Map<number, Person>;
  companies: Map<number, Company>;
}

class StoreManager {
  private static instance: StoreManager;
  private store: DataStore | null = null;
  private readonly STORAGE_KEY = 'absolute_data_store';

  private constructor() {}

  public static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
    }
    return StoreManager.instance;
  }

  private createEmptyStore(): DataStore {
    return {
      media: new Map(),
      watchEvents: [],
      ratings: new Map(),
      watchlist: [],
      importBatches: [],
      genres: [],
      credits: [],
      people: new Map(),
      companies: new Map(),
    };
  }

  public getStore(): DataStore {
    if (this.store) return this.store;
    if (typeof window === 'undefined') return this.createEmptyStore();

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.store = {
          media: new Map(parsed.media || []),
          watchEvents: parsed.watchEvents || [],
          ratings: new Map(parsed.ratings || []),
          watchlist: parsed.watchlist || [],
          importBatches: parsed.importBatches || [],
          genres: parsed.genres || [],
          credits: parsed.credits || [],
          people: new Map(parsed.people || []),
          companies: new Map(parsed.companies || []),
        };
      } else {
        this.store = this.createEmptyStore();
      }
    } catch (e) {
      console.error('Failed to load store from localStorage', e);
      this.store = this.createEmptyStore();
    }

    return this.store;
  }

  public saveStore(store?: DataStore): void {
    if (store) {
      this.store = store;
    }
    
    if (!this.store || typeof window === 'undefined') return;

    try {
      const serialized = {
        media: Array.from(this.store.media.entries()),
        watchEvents: this.store.watchEvents,
        ratings: Array.from(this.store.ratings.entries()),
        watchlist: this.store.watchlist,
        importBatches: this.store.importBatches,
        genres: this.store.genres,
        credits: this.store.credits,
        people: Array.from(this.store.people.entries()),
        companies: Array.from(this.store.companies.entries()),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.error('Failed to save store to localStorage', e);
    }
  }

  public addMedia(media: Media): void {
    const store = this.getStore();
    const key = `${media.mediaType}:${media.tmdbId}`;
    store.media.set(key, media);
    this.saveStore();
  }

  public addWatchEvent(event: WatchEvent): void {
    const store = this.getStore();
    
    // Dedup by basic exact match check or checksum (userId + mediaId + watchedDate + sourceType)
    const exists = store.watchEvents.some(
      (e) =>
        e.mediaId === event.mediaId &&
        e.watchedDate === event.watchedDate &&
        e.userId === event.userId &&
        e.sourceType === event.sourceType
    );

    if (!exists) {
      store.watchEvents.push(event);
      this.saveStore();
    }
  }

  public setRating(rating: UserRating): void {
    const store = this.getStore();
    store.ratings.set(rating.mediaId, rating);
    this.saveStore();
  }

  public addToWatchlist(item: WatchlistItem): void {
    const store = this.getStore();
    const exists = store.watchlist.some((w) => w.mediaId === item.mediaId && w.userId === item.userId);
    if (!exists) {
      store.watchlist.push(item);
      this.saveStore();
    }
  }

  public getMediaByKey(key: string): Media | undefined {
    return this.getStore().media.get(key);
  }

  public getWatchEventsForMedia(mediaKey: string): WatchEvent[] {
    return this.getStore().watchEvents.filter((e) => e.mediaId === mediaKey);
  }

  public getAllWatchedMedia(): Media[] {
    const store = this.getStore();
    const watchedKeys = new Set(store.watchEvents.map((e) => e.mediaId));
    const result: Media[] = [];
    watchedKeys.forEach((key) => {
      const m = store.media.get(key);
      if (m) result.push(m);
    });
    return result;
  }

  public getStats(): StoreStats {
    const store = this.getStore();
    return {
      mediaCount: store.media.size,
      watchEventCount: store.watchEvents.length,
      ratingCount: store.ratings.size,
      watchlistCount: store.watchlist.length,
    };
  }

  public clearAll(): void {
    this.store = this.createEmptyStore();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  public createImportBatch(batch: ImportBatch): void {
    const store = this.getStore();
    store.importBatches.push(batch);
    this.saveStore();
  }

  public undoImportBatch(batchId: string): void {
    const store = this.getStore();
    // Remove all events from this batch
    // Usually import events might have some link like importBatchId. But here it's `importRowId` perhaps. 
    // Wait, importRowId might not strictly map to batchId unless we fetch rows, but for simplicity we remove 
    // watch events that have an importRowId starting with batchId, or we assume batch logic.
    // If not strictly defined, we can just remove all events where importBatchId matches if added, or rely on another mechanism.
    // Assuming `importRowId` is formatted like `${batchId}_${rowIdx}` or similar if we control it.
    // Let's filter out if importRowId contains batchId for now.
    store.watchEvents = store.watchEvents.filter(
      (e) => !(e.importRowId && e.importRowId.startsWith(batchId))
    );
    this.saveStore();
  }

  public exportAllData(): ExportBundle {
    const store = this.getStore();
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        media: Array.from(store.media.entries()),
        watchEvents: store.watchEvents,
        ratings: Array.from(store.ratings.entries()),
        watchlist: store.watchlist,
        importBatches: store.importBatches,
        genres: store.genres,
        credits: store.credits,
        people: Array.from(store.people.entries()),
        companies: Array.from(store.companies.entries()),
      },
    };
  }
}

// Export singleton instance methods directly for ease of use
const storeManager = StoreManager.getInstance();

export const getStore = () => storeManager.getStore();
export const saveStore = (store?: DataStore) => storeManager.saveStore(store);
export const addMedia = (media: Media) => storeManager.addMedia(media);
export const addWatchEvent = (event: WatchEvent) => storeManager.addWatchEvent(event);
export const setRating = (rating: UserRating) => storeManager.setRating(rating);
export const addToWatchlist = (item: WatchlistItem) => storeManager.addToWatchlist(item);
export const getMediaByKey = (key: string) => storeManager.getMediaByKey(key);
export const getWatchEventsForMedia = (mediaKey: string) => storeManager.getWatchEventsForMedia(mediaKey);
export const getAllWatchedMedia = () => storeManager.getAllWatchedMedia();
export const getStats = () => storeManager.getStats();
export const clearAll = () => storeManager.clearAll();
export const createImportBatch = (batch: ImportBatch) => storeManager.createImportBatch(batch);
export const undoImportBatch = (batchId: string) => storeManager.undoImportBatch(batchId);
export const exportAllData = () => storeManager.exportAllData();
