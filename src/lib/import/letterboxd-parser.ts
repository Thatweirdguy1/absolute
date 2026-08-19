import JSZip from 'jszip';
import Papa from 'papaparse';

export interface ParsedFile {
  filename: string;
  purpose: 'diary' | 'ratings' | 'watched' | 'watchlist' | 'reviews' | 'list' | 'profile' | 'unknown';
  headers: string[];
  rowCount: number;
  rows: ParsedRow[];
  errors: ParseError[];
}

export interface ParsedRow {
  sourceFilename: string;
  sourceRowNumber: number;
  rawValues: Record<string, string>;
  normalized: {
    title: string;
    year: number | null;
    letterboxdUri: string | null;
    rating: number | null; // half-star integer 1-10
    watchedDate: string | null; // ISO date string
    addedDate: string | null;
    isRewatch: boolean;
    tags: string[];
    reviewText: string | null;
    listName: string | null;
    listRank: number | null;
  };
  checksum: string; // for idempotency
}

export interface ParseError {
  filename: string;
  row?: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportPreview {
  files: ParsedFile[];
  totalRows: number;
  totalErrors: number;
  totalWarnings: number;
  summary: {
    diaryEntries: number;
    ratings: number;
    watchedTitles: number;
    watchlistItems: number;
    reviews: number;
    lists: { name: string; count: number }[];
  };
}

const IMPORT_FILE_MAX_MB = 50;
const MAX_ROWS_TOTAL = 50000;
const MAX_UNCOMPRESSED_ZIP_SIZE = 150 * 1024 * 1024; // 150MB

export function sanitizeHtml(text: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>?/gm, '').trim();
}

export function normalizeRating(value: string): number | null {
  if (!value) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  const halfStar = Math.round(num * 2);
  if (halfStar >= 1 && halfStar <= 10) return halfStar;
  return null;
}

export function normalizeDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

export function normalizeTitle(value: string): string {
  if (!value) return '';
  return value.trim().normalize('NFC').replace(/\s+/g, ' ');
}

export function generateRowChecksum(row: ParsedRow): string {
  const str = JSON.stringify(row.normalized);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function stripFormulaInjection(val: string): string {
  if (!val) return val;
  const trimmed = val.trim();
  if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
    return "'" + trimmed;
  }
  return val;
}

export function detectFilePurpose(filename: string, headers: string[]): ParsedFile['purpose'] {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('diary')) return 'diary';
  if (lowerName.includes('ratings')) return 'ratings';
  if (lowerName.includes('watchlist')) return 'watchlist';
  if (lowerName.includes('watched')) return 'watched';
  if (lowerName.includes('reviews')) return 'reviews';
  if (lowerName.includes('profile')) return 'profile';
  if (lowerName.includes('lists/') || lowerName.includes('list')) return 'list';

  const hasName = headers.includes('Name');
  const hasReview = headers.includes('Review');
  const hasRewatch = headers.includes('Rewatch');
  const hasWatchedDate = headers.includes('Watched Date');
  
  if (hasName && hasReview) return 'reviews';
  if (hasName && hasRewatch && hasWatchedDate) return 'diary';
  if (hasName && headers.includes('Rating') && !hasRewatch) return 'ratings';
  
  return 'unknown';
}

export async function parseCsvFile(file: File | { name: string; content: string }): Promise<ParsedFile> {
  const filename = 'name' in file ? file.name : 'unknown.csv';
  const content = 'content' in file ? file.content : await (file as File).text();
  
  return new Promise((resolve) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => stripFormulaInjection(value),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const purpose = detectFilePurpose(filename, headers);
        const rows: ParsedRow[] = [];
        const errors: ParseError[] = [];
        
        results.data.forEach((rowData: any, index: number) => {
          const rawValues = rowData as Record<string, string>;
          const sourceRowNumber = index + 2;
          
          try {
            const normalized = {
              title: normalizeTitle(rawValues['Name'] || rawValues['Title'] || ''),
              year: rawValues['Year'] ? parseInt(rawValues['Year'], 10) : null,
              letterboxdUri: rawValues['Letterboxd URI'] || null,
              rating: normalizeRating(rawValues['Rating']),
              watchedDate: normalizeDate(rawValues['Watched Date'] || rawValues['Date']),
              addedDate: normalizeDate(rawValues['Date']),
              isRewatch: rawValues['Rewatch']?.toLowerCase() === 'yes',
              tags: rawValues['Tags'] ? rawValues['Tags'].split(',').map(t => t.trim()).filter(Boolean) : [],
              reviewText: sanitizeHtml(rawValues['Review'] || ''),
              listName: purpose === 'list' ? filename.replace('.csv', '') : null,
              listRank: rawValues['Position'] ? parseInt(rawValues['Position'], 10) : null,
            };

            const row: ParsedRow = {
              sourceFilename: filename,
              sourceRowNumber,
              rawValues,
              normalized,
              checksum: ''
            };
            row.checksum = generateRowChecksum(row);
            rows.push(row);
          } catch (e: any) {
            errors.push({
              filename,
              row: sourceRowNumber,
              message: e.message || 'Failed to parse row',
              severity: 'error'
            });
          }
        });

        results.errors.forEach(e => {
          errors.push({
            filename,
            row: e.row ? e.row + 2 : undefined,
            message: e.message,
            severity: 'warning'
          });
        });

        resolve({
          filename,
          purpose,
          headers,
          rowCount: rows.length,
          rows,
          errors
        });
      },
      error: (error: Error) => {
        resolve({
          filename,
          purpose: 'unknown',
          headers: [],
          rowCount: 0,
          rows: [],
          errors: [{ filename, message: error.message, severity: 'error' }]
        });
      }
    });
  });
}

export async function parseZipFile(file: File): Promise<ParsedFile[]> {
  const zip = new JSZip();
  let loadedZip: JSZip;
  try {
    loadedZip = await zip.loadAsync(file);
  } catch (e: any) {
    throw new Error('Invalid ZIP file: ' + e.message);
  }

  const parsedFiles: ParsedFile[] = [];
  let uncompressedSize = 0;

  for (const [filename, zipEntry] of Object.entries(loadedZip.files)) {
    if (zipEntry.dir) continue;
    if (filename.includes('..') || filename.startsWith('/')) {
      throw new Error('Path traversal detected in ZIP');
    }
    if (!filename.toLowerCase().endsWith('.csv')) continue;

    const content = await zipEntry.async('string');
    uncompressedSize += content.length;
    if (uncompressedSize > MAX_UNCOMPRESSED_ZIP_SIZE) {
      throw new Error('ZIP bomb detected (exceeds uncompressed size limit)');
    }

    const parsedFile = await parseCsvFile({ name: filename, content });
    parsedFiles.push(parsedFile);
  }

  return parsedFiles;
}

export async function parseImportFiles(files: File[]): Promise<ImportPreview> {
  const parsedFiles: ParsedFile[] = [];
  let totalSize = 0;

  for (const file of files) {
    totalSize += file.size;
    if (totalSize > IMPORT_FILE_MAX_MB * 1024 * 1024) {
      throw new Error(`Total import size exceeds ${IMPORT_FILE_MAX_MB}MB limit`);
    }

    if (file.name.toLowerCase().endsWith('.zip')) {
      const zipParsed = await parseZipFile(file);
      parsedFiles.push(...zipParsed);
    } else if (file.name.toLowerCase().endsWith('.csv')) {
      const csvParsed = await parseCsvFile(file);
      parsedFiles.push(csvParsed);
    }
  }

  let totalRows = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  const summary = {
    diaryEntries: 0,
    ratings: 0,
    watchedTitles: 0,
    watchlistItems: 0,
    reviews: 0,
    lists: [] as { name: string; count: number }[]
  };

  for (const pf of parsedFiles) {
    totalRows += pf.rowCount;
    if (totalRows > MAX_ROWS_TOTAL) {
      throw new Error(`Total rows exceed ${MAX_ROWS_TOTAL} limit`);
    }

    const errCount = pf.errors.filter(e => e.severity === 'error').length;
    const warnCount = pf.errors.filter(e => e.severity === 'warning').length;
    totalErrors += errCount;
    totalWarnings += warnCount;

    switch (pf.purpose) {
      case 'diary': summary.diaryEntries += pf.rowCount; break;
      case 'ratings': summary.ratings += pf.rowCount; break;
      case 'watched': summary.watchedTitles += pf.rowCount; break;
      case 'watchlist': summary.watchlistItems += pf.rowCount; break;
      case 'reviews': summary.reviews += pf.rowCount; break;
      case 'list': 
        summary.lists.push({ name: pf.filename, count: pf.rowCount });
        break;
    }
  }

  return {
    files: parsedFiles,
    totalRows,
    totalErrors,
    totalWarnings,
    summary
  };
}
