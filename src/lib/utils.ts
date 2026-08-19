import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MediaType } from '../types';
import { TMDB_IMAGE_BASE, HALF_STAR_TO_DISPLAY, DISPLAY_TO_HALF_STAR } from './constants';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRuntime(minutes: number | null): string {
  if (!minutes) return 'Unknown';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatRating(halfStars: number, scale: '5' | '10' = '5'): string {
  if (scale === '5') {
    const val = HALF_STAR_TO_DISPLAY[halfStars];
    return val !== undefined ? val.toFixed(1) : 'N/A';
  }
  return halfStars.toString();
}

export function halfStarToDisplay(halfStars: number): number | undefined {
  return HALF_STAR_TO_DISPLAY[halfStars];
}

export function displayToHalfStar(display: number): number | undefined {
  return DISPLAY_TO_HALF_STAR[display];
}

export function formatNumber(num: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatDate(dateStr: string, locale = 'en-US'): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateStr));
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export function getMediaKey(tmdbId: number, mediaType: MediaType): string {
  return `${mediaType}:${tmdbId}`;
}

export function getPosterUrl(path: string | null, size: string = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: string = 'w1280'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}${size}${path}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function calculateDecade(year: number | null): number | null {
  if (!year) return null;
  return Math.floor(year / 10) * 10;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
