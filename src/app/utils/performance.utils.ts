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

/* ─────────── Audience composition (Figma: Performance / Audience composition / V1) ─────────── */

/** Pie order (clockwise from 12 o'clock) and slice colors from the design. */
const COMPOSITION_SLICES: { key: PerformancePlatform; label: string; color: string }[] = [
  { key: 'spotify', label: 'Spotify', color: '#E79888' },
  { key: 'instagram', label: 'Instagram', color: '#8DC4C2' },
  { key: 'youtube', label: 'YouTube', color: '#FFCC8F' },
  { key: 'tiktok', label: 'TikTok', color: '#4B6095' },
];

export interface CompositionSlice {
  key: PerformancePlatform;
  label: string;
  color: string;
  /** Null when the platform has no count. */
  value: number | null;
  /** Share of the total in percent, one decimal; null when unavailable. */
  share: number | null;
  /** SVG path for the slice in a 148×148 box; null when not drawn. */
  path: string | null;
}

export interface AudienceComposition {
  total: number | null;
  slices: CompositionSlice[];
  /**
   * All four platforms have a count. Only then is the pie drawn: a pie of the
   * known platforms alone would read as the whole audience.
   */
  complete: boolean;
}

/**
 * The artist's audience split across the four platform counts. Shares use
 * largest-remainder rounding so they add up to exactly 100%. These are
 * follower counts, not track streams or unique people.
 */
export function audienceComposition(artist: PerformanceArtist | null | undefined): AudienceComposition {
  const values = COMPOSITION_SLICES.map(s => artist?.audience[s.key] ?? null);
  const known = values.filter((v): v is number => v !== null && v > 0);
  const total = known.length ? known.reduce((a, b) => a + b, 0) : null;
  const complete = values.every(v => v !== null && v > 0);

  // Shares of a partial total would overstate the known platforms, so none then.
  const shares = complete && total ? largestRemainder(values.map(v => v ?? 0), total) : values.map(() => null);
  const paths = complete && total ? piePaths(values as number[], total) : values.map(() => null);

  return {
    total,
    complete,
    slices: COMPOSITION_SLICES.map((s, i) => ({
      ...s,
      value: values[i],
      share: values[i] !== null ? shares[i] : null,
      path: paths[i],
    })),
  };
}

/** Tenths of a percent that sum to 100.0, by largest remainder. */
function largestRemainder(values: number[], total: number): number[] {
  const exact = values.map(v => (v / total) * 1000);
  const floors = exact.map(Math.floor);
  let left = 1000 - floors.reduce((a, b) => a + b, 0);
  exact
    .map((v, i) => ({ i, rest: v - floors[i] }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ i }) => { if (left > 0 && values[i] > 0) { floors[i]++; left--; } });
  return floors.map(f => f / 10);
}

/** Slice paths, angle = count / total × 360°, starting at 12 o'clock, clockwise. */
function piePaths(values: number[], total: number): (string | null)[] {
  const c = 74;
  const r = 73.5;
  const point = (angle: number) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return `${(c + r * Math.cos(rad)).toFixed(3)} ${(c + r * Math.sin(rad)).toFixed(3)}`;
  };
  let start = 0;
  return values.map(value => {
    const sweep = (value / total) * 360;
    if (sweep <= 0) { return null; }
    const end = start + sweep;
    // A single platform holding everything is a full circle, not an arc.
    const path = sweep >= 359.999
      ? `M ${c - r} ${c} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`
      : `M ${c} ${c} L ${point(start)} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${point(end)} Z`;
    start = end;
    return path;
  });
}

export type AudienceSize = 'any' | 'under1m' | '1to10m' | 'over10m';
export type EcuFilter = 'any' | 'available';

/**
 * Social ranking: artists with a follower count on the platform, most
 * followers first. Followers are the only Instagram/TikTok metric stored
 * (tiktok_likes is empty and there is no engagement or growth data).
 */
export type SocialFilter = '' | 'instagram' | 'tiktok';
export const SOCIAL_PLATFORMS: Exclude<SocialFilter, ''>[] = ['instagram', 'tiktok'];
export type PerformanceSort = 'audience' | 'name';

export interface PerformanceFilters {
  origin: string;           // ISO code, or '' for all
  platform: PerformancePlatform | '';
  size: AudienceSize;
  ecu: EcuFilter;
  social: SocialFilter;
}

export const DEFAULT_PERFORMANCE_FILTERS: PerformanceFilters = {
  origin: '',
  platform: '',
  size: 'any',
  ecu: 'any',
  social: '',
};

/** Most followers on the platform first; artists without the count are filtered out before. */
export function sortBySocial(tracks: PerformanceTrack[], platform: Exclude<SocialFilter, ''>): PerformanceTrack[] {
  return [...tracks].sort((a, b) =>
    (b.artist?.audience[platform] ?? -1) - (a.artist?.audience[platform] ?? -1)
    || (a.artist?.name ?? '').localeCompare(b.artist?.name ?? '')
    || a.name.localeCompare(b.name));
}

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
  if (filters.social && !(artist?.audience[filters.social])) { return false; }
  if (filters.ecu === 'available' && !track.extendedCommercialUse) { return false; }
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

/** `keepOrder` keeps artists in the order their tracks arrive (a search ranking). */
export function groupTracksByArtist(tracks: PerformanceTrack[], sort: PerformanceSort, keepOrder = false): PerformanceArtistRow[] {
  const rows = new Map<string, PerformanceArtistRow>();
  for (const track of tracks) {
    if (!track.artist) { continue; }
    const row = rows.get(track.artist.uuid) ?? { artist: track.artist, tracks: [] };
    row.tracks.push(track);
    rows.set(track.artist.uuid, row);
  }
  const list = [...rows.values()];
  if (keepOrder) { return list; }
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
