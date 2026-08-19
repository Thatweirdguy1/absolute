import { describe, it, expect } from 'vitest';
import { 
  normalizeRating, 
  normalizeDate, 
  normalizeTitle, 
  detectFilePurpose, 
  sanitizeHtml, 
  generateRowChecksum 
} from '../letterboxd-parser';

describe('Letterboxd Parser Utilities', () => {
  it('normalizes ratings correctly', () => {
    expect(normalizeRating('5')).toBe(10);
    expect(normalizeRating('4.5')).toBe(9);
    expect(normalizeRating('3')).toBe(6);
    expect(normalizeRating('0.5')).toBe(1);
    expect(normalizeRating('')).toBeNull();
    expect(normalizeRating('abc')).toBeNull();
  });

  it('normalizes dates correctly', () => {
    expect(normalizeDate('2024-01-15')).toBe('2024-01-15');
    expect(normalizeDate('2024/01/15')).toBe('2024-01-15');
    expect(normalizeDate('')).toBeNull();
    expect(normalizeDate('invalid')).toBeNull();
  });

  it('normalizes titles correctly', () => {
    expect(normalizeTitle(' Normal Title ')).toBe('Normal Title');
    expect(normalizeTitle('Title  with   spaces')).toBe('Title with spaces');
    expect(normalizeTitle('Am\u00e9lie')).toBe('Amélie');
  });

  it('detects file purpose correctly', () => {
    expect(detectFilePurpose('diary.csv', ['Date', 'Name', 'Year', 'Letterboxd URI', 'Rating', 'Rewatch', 'Tags', 'Watched Date'])).toBe('diary');
    expect(detectFilePurpose('ratings.csv', ['Date', 'Name', 'Year', 'Letterboxd URI', 'Rating'])).toBe('ratings');
    expect(detectFilePurpose('watched.csv', ['Date', 'Name', 'Year', 'Letterboxd URI'])).toBe('watched');
    expect(detectFilePurpose('unknown.csv', ['Name', 'Review'])).toBe('reviews');
  });

  it('sanitizes HTML from reviews', () => {
    expect(sanitizeHtml('<p>Great movie!</p>')).toBe('Great movie!');
    expect(sanitizeHtml('<b>Bold</b> and <i>italic</i>')).toBe('Bold and italic');
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('generates consistent checksums', () => {
    const row = {
      sourceFilename: 'diary.csv',
      sourceRowNumber: 2,
      rawValues: {},
      normalized: {
        title: 'Movie',
        year: 2020,
        letterboxdUri: 'uri',
        rating: 8,
        watchedDate: '2024-01-01',
        addedDate: '2024-01-01',
        isRewatch: false,
        tags: [],
        reviewText: null,
        listName: null,
        listRank: null
      },
      checksum: ''
    };
    const c1 = generateRowChecksum(row);
    const c2 = generateRowChecksum(row);
    expect(c1).toBe(c2);
    expect(c1).toBeTruthy();
    
    const row2 = JSON.parse(JSON.stringify(row));
    row2.normalized.title = 'Other Movie';
    const c3 = generateRowChecksum(row2);
    expect(c1).not.toBe(c3);
  });
});
