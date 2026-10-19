import {
  PerformanceArtist,
  PerformancePlatform,
  PerformanceTrack,
} from '../interfaces/response/performance.response';

export const PERFORMANCE_PLATFORMS: { key: PerformancePlatform; label: string; color: string }[] = [
  { key: 'tiktok', label: 'TikTok', color: '#25F4EE' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C' },
  { key: 'youtube', label: 'YouTube', color: '#FF0033' },
  { key: 'spotify', label: 'Spotify', color: '#1ED760' },
];

export type AudienceSize = 'any' | 'under1m' | '1to10m' | 'over10m';
export type EcuFilter = 'any' | 'available' | 'notListed';
export type PerformanceSort = 'audience' | 'name';

export interface PerformanceFilters {
  origin: string;           // ISO code, or '' for all
  platform: PerformancePlatform | '';
  size: AudienceSize;
  ecu: EcuFilter;
}

export const DEFAULT_PERFORMANCE_FILTERS: PerformanceFilters = {
  origin: '',
  platform: '',
  size: 'any',
  ecu: 'any',
};

/** One artist with the tracks of theirs that survived the filters. */
export interface PerformanceArtistRow {
  artist: PerformanceArtist;
  tracks: PerformanceTrack[];
}

/**
 * Compact audience counts as the design writes them: "38 M", "12.6 M", "600 k".
 * `millionDigits` widens the decimals for the per-platform breakdown ("3.36 M").
 */
export function formatAudience(value: number | null | undefined, millionDigits = 1): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) { return null; }
  if (value >= 1_000_000) {
    return `${trimDecimals(value / 1_000_000, millionDigits)} M`;
  }
  if (value >= 1_000) {
    return `${trimDecimals(value / 1_000, 0)} k`;
  }
  return String(Math.round(value));
}

function trimDecimals(value: number, digits: number): string {
  return String(Number(value.toFixed(digits)));
}

/** Country name in the active language, from an ISO alpha-2 code. */
export function countryName(code: string | null | undefined, lang: string): string | null {
  const iso = (code ?? '').trim().toUpperCase();
  if (iso.length !== 2) { return null; }
  try {
    return new Intl.DisplayNames([lang || 'en'], { type: 'region' }).of(iso) ?? iso;
  } catch {
    return iso;
  }
}

export function matchesPerformanceFilters(track: PerformanceTrack, filters: PerformanceFilters): boolean {
  const artist = track.artist;
  if (filters.origin && artist?.countryCode !== filters.origin) { return false; }
  if (filters.platform && !(artist?.audience[filters.platform])) { return false; }
  if (filters.ecu === 'available' && !track.extendedCommercialUse) { return false; }
  if (filters.ecu === 'notListed' && track.extendedCommercialUse) { return false; }
  if (filters.size !== 'any') {
    const total = artist?.totalAudience;
    if (total === null || total === undefined) { return false; }
    if (filters.size === 'under1m' && total >= 1_000_000) { return false; }
    if (filters.size === '1to10m' && (total < 1_000_000 || total >= 10_000_000)) { return false; }
    if (filters.size === 'over10m' && total < 10_000_000) { return false; }
  }
  return true;
}

/** Biggest audience first; unknown audiences sink to the bottom. */
export function sortPerformanceTracks(tracks: PerformanceTrack[], sort: PerformanceSort): PerformanceTrack[] {
  const copy = [...tracks];
  if (sort === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy.sort((a, b) =>
    (b.artist?.totalAudience ?? -1) - (a.artist?.totalAudience ?? -1) || a.name.localeCompare(b.name));
}

export function groupTracksByArtist(tracks: PerformanceTrack[], sort: PerformanceSort): PerformanceArtistRow[] {
  const rows = new Map<string, PerformanceArtistRow>();
  for (const track of tracks) {
    if (!track.artist) { continue; }
    const row = rows.get(track.artist.uuid) ?? { artist: track.artist, tracks: [] };
    row.tracks.push(track);
    rows.set(track.artist.uuid, row);
  }
  const list = [...rows.values()];
  if (sort === 'name') {
    return list.sort((a, b) => a.artist.name.localeCompare(b.artist.name));
  }
  return list.sort((a, b) =>
    (b.artist.totalAudience ?? -1) - (a.artist.totalAudience ?? -1) || a.artist.name.localeCompare(b.artist.name));
}

/**
 * Page numbers for the pager: first, last, and a window around the current
 * page, with null marking a gap ("1 2 3 … 12").
 */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 5) { return Array.from({ length: total }, (_, i) => i + 1); }
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) { [2, 3].forEach(p => pages.add(p)); }
  if (current >= total - 2) { [total - 1, total - 2].forEach(p => pages.add(p)); }
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) { out.push(null); }
    out.push(page);
  });
  return out;
}
