import { useStore } from './data-store';

export type DemoProfile = {
  profileId: string;
  name: string;
  movies: any[]; // define a broad type for now
};

const moviesAlex = [
  { tmdbId: 550, title: 'Fight Club', releaseYear: 1999, runtime: 139, posterPath: '/pB8BM7pdSp6B6Ih7QI4S2t0POoT.jpg', genres: ['Drama'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.4, tmdbVoteCount: 26000, imdbId: 'tt0137523' },
  { tmdbId: 27205, title: 'Inception', releaseYear: 2010, runtime: 148, posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', genres: ['Action', 'Sci-Fi', 'Adventure'], originalLanguage: 'en', originCountries: ['US', 'GB'], tmdbVoteAverage: 8.4, tmdbVoteCount: 33000, imdbId: 'tt1375666' },
  { tmdbId: 155, title: 'The Dark Knight', releaseYear: 2008, runtime: 152, posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', genres: ['Drama', 'Action', 'Crime', 'Thriller'], originalLanguage: 'en', originCountries: ['US', 'GB'], tmdbVoteAverage: 8.5, tmdbVoteCount: 30000, imdbId: 'tt0468569' },
  { tmdbId: 680, title: 'Pulp Fiction', releaseYear: 1994, runtime: 154, posterPath: '/d5iIlFn5s0ImszYzBPbOYKQmG_1.jpg', genres: ['Thriller', 'Crime'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.5, tmdbVoteCount: 25000, imdbId: 'tt0110912' },
  { tmdbId: 496243, title: 'Parasite', releaseYear: 2019, runtime: 132, posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', genres: ['Comedy', 'Thriller', 'Drama'], originalLanguage: 'ko', originCountries: ['KR'], tmdbVoteAverage: 8.5, tmdbVoteCount: 16000, imdbId: 'tt6751668' },
  { tmdbId: 244786, title: 'Whiplash', releaseYear: 2014, runtime: 107, posterPath: '/7fn624j5lj3xTme2SgiLCeuedmO.jpg', genres: ['Drama', 'Music'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.4, tmdbVoteCount: 13000, imdbId: 'tt2582802' },
  { tmdbId: 37799, title: 'The Social Network', releaseYear: 2010, runtime: 120, posterPath: '/n0ycb2dIGZYZNEeYwh0j7YJtK1f.jpg', genres: ['Drama'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 7.3, tmdbVoteCount: 11000, imdbId: 'tt1285016' },
  { tmdbId: 545611, title: 'Everything Everywhere All at Once', releaseYear: 2022, runtime: 139, posterPath: '/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg', genres: ['Action', 'Adventure', 'Science Fiction'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 7.8, tmdbVoteCount: 5000, imdbId: 'tt6710474' },
  { tmdbId: 157336, title: 'Interstellar', releaseYear: 2014, runtime: 169, posterPath: '/gEU2QlsUUHX21cXnfDfkNC7aD11.jpg', genres: ['Adventure', 'Drama', 'Science Fiction'], originalLanguage: 'en', originCountries: ['US', 'GB', 'CA'], tmdbVoteAverage: 8.4, tmdbVoteCount: 32000, imdbId: 'tt0816692' },
  { tmdbId: 603, title: 'The Matrix', releaseYear: 1999, runtime: 136, posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', genres: ['Action', 'Science Fiction'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.2, tmdbVoteCount: 23000, imdbId: 'tt0133093' },
  { tmdbId: 769, title: 'GoodFellas', releaseYear: 1990, runtime: 145, posterPath: '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', genres: ['Drama', 'Crime'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.5, tmdbVoteCount: 11000, imdbId: 'tt0099685' },
  { tmdbId: 424, title: 'Schindler\'s List', releaseYear: 1993, runtime: 195, posterPath: '/sF1U4EUQS8YHUYjNdlHk1S1Xq4S.jpg', genres: ['Drama', 'History', 'War'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.6, tmdbVoteCount: 14000, imdbId: 'tt0108052' },
  { tmdbId: 278, title: 'The Shawshank Redemption', releaseYear: 1994, runtime: 142, posterPath: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', genres: ['Drama', 'Crime'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.7, tmdbVoteCount: 24000, imdbId: 'tt0111161' },
  { tmdbId: 129, title: 'Spirited Away', releaseYear: 2001, runtime: 125, posterPath: '/39wmItIWsg5sZMyRUHLkBgkYA4j.jpg', genres: ['Animation', 'Family', 'Fantasy'], originalLanguage: 'ja', originCountries: ['JP'], tmdbVoteAverage: 8.5, tmdbVoteCount: 14000, imdbId: 'tt0245429' },
  { tmdbId: 335984, title: 'Blade Runner 2049', releaseYear: 2017, runtime: 164, posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', genres: ['Science Fiction', 'Drama'], originalLanguage: 'en', originCountries: ['US', 'GB', 'CA'], tmdbVoteAverage: 7.5, tmdbVoteCount: 12000, imdbId: 'tt1856101' },
  { tmdbId: 419430, title: 'Get Out', releaseYear: 2017, runtime: 104, posterPath: '/tFXcEccSQAmRoIdcgXSy58RzP7Z.jpg', genres: ['Mystery', 'Thriller', 'Horror'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 7.6, tmdbVoteCount: 11000, imdbId: 'tt5052448' },
];

const moviesMorgan = [
  { tmdbId: 120467, title: 'The Grand Budapest Hotel', releaseYear: 2014, runtime: 100, posterPath: '/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg', genres: ['Comedy', 'Drama'], originalLanguage: 'en', originCountries: ['US', 'DE'], tmdbVoteAverage: 8.0, tmdbVoteCount: 13000, imdbId: 'tt2278388' },
  { tmdbId: 313369, title: 'La La Land', releaseYear: 2016, runtime: 128, posterPath: '/uDO8zWDhfWwoFdKS4fH22nWMEgc.jpg', genres: ['Comedy', 'Drama', 'Romance', 'Music'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 7.9, tmdbVoteCount: 15000, imdbId: 'tt3783958' },
  { tmdbId: 76341, title: 'Mad Max: Fury Road', releaseYear: 2015, runtime: 121, posterPath: '/hA2ple9q4cbOQ022XFvW7rY6eK1.jpg', genres: ['Action', 'Adventure', 'Science Fiction'], originalLanguage: 'en', originCountries: ['AU', 'US'], tmdbVoteAverage: 7.6, tmdbVoteCount: 20000, imdbId: 'tt1392190' },
  { tmdbId: 438631, title: 'Dune', releaseYear: 2021, runtime: 155, posterPath: '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', genres: ['Science Fiction', 'Adventure'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 7.8, tmdbVoteCount: 9000, imdbId: 'tt1160419' },
  { tmdbId: 414906, title: 'The Batman', releaseYear: 2022, runtime: 176, posterPath: '/74xTEgt7R36Fpooo50r9T25onhq.jpg', genres: ['Crime', 'Mystery', 'Thriller'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 7.7, tmdbVoteCount: 8000, imdbId: 'tt1877830' },
  { tmdbId: 872585, title: 'Oppenheimer', releaseYear: 2023, runtime: 181, posterPath: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', genres: ['Drama', 'History'], originalLanguage: 'en', originCountries: ['US', 'GB'], tmdbVoteAverage: 8.2, tmdbVoteCount: 5000, imdbId: 'tt15398776' },
  { tmdbId: 346698, title: 'Barbie', releaseYear: 2023, runtime: 114, posterPath: '/cgYg04miVQUz2oKkX47vB6W5yI4.jpg', genres: ['Comedy', 'Adventure', 'Fantasy'], originalLanguage: 'en', originCountries: ['US', 'GB'], tmdbVoteAverage: 7.1, tmdbVoteCount: 7000, imdbId: 'tt1517268' },
  { tmdbId: 324857, title: 'Spider-Man: Into the Spider-Verse', releaseYear: 2018, runtime: 117, posterPath: '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', genres: ['Action', 'Adventure', 'Animation', 'Science Fiction'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.4, tmdbVoteCount: 13000, imdbId: 'tt4633694' },
  { tmdbId: 475557, title: 'Joker', releaseYear: 2019, runtime: 122, posterPath: '/udDclJoHjfpt8MvSMzNDTE2nN1Q.jpg', genres: ['Crime', 'Thriller', 'Drama'], originalLanguage: 'en', originCountries: ['US', 'CA'], tmdbVoteAverage: 8.2, tmdbVoteCount: 23000, imdbId: 'tt7286456' },
  { tmdbId: 62, title: '2001: A Space Odyssey', releaseYear: 1968, runtime: 149, posterPath: '/1dOEOKHK37oPEEebvXfD5c0zPBB.jpg', genres: ['Science Fiction', 'Mystery', 'Adventure'], originalLanguage: 'en', originCountries: ['US', 'GB'], tmdbVoteAverage: 8.3, tmdbVoteCount: 10000, imdbId: 'tt0062622' },
  { tmdbId: 103, title: 'Taxi Driver', releaseYear: 1976, runtime: 114, posterPath: '/x1QZHSq96O4HqaoNqBhh1X1hDk0.jpg', genres: ['Crime', 'Drama'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.2, tmdbVoteCount: 11000, imdbId: 'tt0075314' },
  { tmdbId: 238, title: 'The Godfather', releaseYear: 1972, runtime: 175, posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', genres: ['Drama', 'Crime'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.7, tmdbVoteCount: 18000, imdbId: 'tt0068646' },
  { tmdbId: 38, title: 'Eternal Sunshine of the Spotless Mind', releaseYear: 2004, runtime: 108, posterPath: '/5MwkWH9txO4x3e76XG1nQx7n2A4.jpg', genres: ['Science Fiction', 'Drama', 'Romance'], originalLanguage: 'en', originCountries: ['US'], tmdbVoteAverage: 8.1, tmdbVoteCount: 13000, imdbId: 'tt0338013' },
];

export function getDemoProfile(name: 'cinephile_alex' | 'movie_morgan'): DemoProfile {
  if (name === 'cinephile_alex') {
    return {
      profileId: 'alex_123',
      name: 'cinephile_alex',
      movies: moviesAlex.map((m, i) => ({
        ...m,
        userRating: Math.floor(Math.random() * 5) + 6, // 6 to 10
        watchedDate: new Date(2024, i % 12, (i * 3) % 28 + 1).toISOString(),
        isRewatch: i % 5 === 0,
        diaryEntry: `Watched on ${new Date(2024, i % 12, (i * 3) % 28 + 1).toLocaleDateString()}`
      }))
    };
  }

  return {
    profileId: 'morgan_456',
    name: 'movie_morgan',
    movies: moviesMorgan.map((m, i) => ({
      ...m,
      userRating: Math.floor(Math.random() * 6) + 4, // 4 to 9
      watchedDate: new Date(2025, i % 6, (i * 5) % 28 + 1).toISOString(),
      isRewatch: i % 10 === 0,
      diaryEntry: `Saw this on a lazy sunday.`
    }))
  };
}

let isDemo = false;

export function seedDemoData() {
  const store = useStore.getState();
  const alexProfile = getDemoProfile('cinephile_alex');
  // Just inserting into the store using assuming an action like addMovies exists
  // If not, we set the state directly
  if (store.setMovies) {
    store.setMovies(alexProfile.movies);
  } else {
    console.warn("setMovies not found in store, could not seed data.");
  }
  isDemo = true;
}

export function isDemoMode(): boolean {
  return isDemo;
}
