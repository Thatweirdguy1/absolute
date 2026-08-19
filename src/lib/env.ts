export const env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  TMDB_API_READ_TOKEN: process.env.TMDB_API_READ_TOKEN || '',
  IMDB_PROVIDER: process.env.IMDB_PROVIDER || 'disabled',
  IMDB_API_KEY: process.env.IMDB_API_KEY || '',
  IMPORT_FILE_MAX_MB: process.env.IMPORT_FILE_MAX_MB ? parseInt(process.env.IMPORT_FILE_MAX_MB, 10) : 25,
};

if (typeof window === 'undefined' && !env.TMDB_API_READ_TOKEN) {
  console.warn('Warning: TMDB_API_READ_TOKEN is missing. Metadata fetching will not work.');
}
