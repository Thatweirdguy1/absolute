export interface ExternalRating {
  provider: string;
  mediaId: string; // e.g. IMDb ID
  score: number | null;
  scale: number; // e.g. 10 for IMDb
  voteCount: number | null;
  fetchedAt: string;
  available: boolean;
  unavailableReason?: string;
}

export interface ExternalRatingProvider {
  name: string;
  getUrl(mediaId: string): string;
  fetchRating(mediaId: string): Promise<ExternalRating>;
  isConfigured(): boolean;
}

export class IMDbProvider implements ExternalRatingProvider {
  name = 'IMDb';

  isConfigured(): boolean {
    // In a real app, you would check process.env variables here
    // e.g. return process.env.IMDB_PROVIDER !== 'disabled' && !!process.env.IMDB_API_KEY;
    const isDisabled = process.env.IMDB_PROVIDER === 'disabled';
    const hasKey = !!process.env.IMDB_API_KEY;
    return !isDisabled && hasKey;
  }

  getUrl(mediaId: string): string {
    return `https://www.imdb.com/title/${mediaId}/`;
  }

  async fetchRating(mediaId: string): Promise<ExternalRating> {
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        mediaId,
        score: null,
        scale: 10,
        voteCount: null,
        fetchedAt: new Date().toISOString(),
        available: false,
        unavailableReason: 'IMDb rating provider not configured. IMDb link is available.'
      };
    }

    // We never scrape IMDb, so if an API key is provided, we would call an official or 3rd party API here.
    // For now, return unavailable unless implemented.
    return {
      provider: this.name,
      mediaId,
      score: null,
      scale: 10,
      voteCount: null,
      fetchedAt: new Date().toISOString(),
      available: false,
      unavailableReason: 'IMDb API integration not yet implemented.'
    };
  }
}
