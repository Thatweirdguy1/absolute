export const APP_NAME = 'Absolute';
export const APP_TAGLINE = 'Your cinema. Quantified.';
export const APP_DESCRIPTION = 'Import your viewing history and discover what your taste says about you.';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/';
export const TMDB_POSTER_SIZES = ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'];
export const TMDB_BACKDROP_SIZES = ['w300', 'w780', 'w1280', 'original'];

export const RATING_SCALE = {
  min: 1,
  max: 10,
  step: 1,
  displayMax: 5.0,
  displayStep: 0.5
};

export const MAX_IMPORT_FILE_MB = 25;

export const HALF_STAR_TO_DISPLAY: Record<number, number> = {
  1: 0.5,
  2: 1.0,
  3: 1.5,
  4: 2.0,
  5: 2.5,
  6: 3.0,
  7: 3.5,
  8: 4.0,
  9: 4.5,
  10: 5.0,
};

export const DISPLAY_TO_HALF_STAR: Record<number, number> = {
  0.5: 1,
  1.0: 2,
  1.5: 3,
  2.0: 4,
  2.5: 5,
  3.0: 6,
  3.5: 7,
  4.0: 8,
  4.5: 9,
  5.0: 10,
};

export const GENRE_COLOR_MAP: Record<string, string> = {
  action: 'red',
  comedy: 'yellow',
  drama: 'blue',
  horror: 'green-dark',
  sciFi: 'purple',
  romance: 'pink',
  documentary: 'gray',
};

export const ARCHETYPES = [
  'The Auteur Devotee',
  'The Genre Purist',
  'The Decade Drifter',
  'The Completionist',
  'The Mood Curator',
  'The Hidden Gem Hunter',
  'The Blockbuster Enthusiast',
  'The World Cinema Explorer',
  'The Nostalgia Architect',
  'The Cinematic Omnivore',
];

export const MOODS = [
  { id: 'dark', name: 'Dark' },
  { id: 'uplifting', name: 'Uplifting' },
  { id: 'tense', name: 'Tense' },
  { id: 'atmospheric', name: 'Atmospheric' },
  { id: 'surreal', name: 'Surreal' },
  { id: 'thought-provoking', name: 'Thought-provoking' },
  { id: 'quirky', name: 'Quirky' },
  { id: 'emotional', name: 'Emotional' },
  { id: 'fast-paced', name: 'Fast-paced' },
  { id: 'slow-burn', name: 'Slow-burn' },
];
