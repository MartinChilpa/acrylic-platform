import { PerformanceArtist, PerformancePlatform, PerformanceTrack } from '../interfaces/response/performance.response';

/**
 * Unified search for the Performance tab. One input, read as one of:
 *
 *   audience  "artists with a big fanbase in Senegal" -> Chartmetric Instagram
 *             top countries / top cities (only when fanbase/audience is said)
 *   geo       "Senegal", "Senegalese artists", "Lyon" -> artist_artist.country
 *             or artist_artist.hometown
 *   platform  "best artists on TikTok" (+ optional geo) -> ranked by that
 *             platform's follower count
 *   text      "Didi B", "Didu B" -> track and artist names, exact matches
 *             first, then close spellings, with a "Did you mean" suggestion
 *
 * Nothing here is seeded with sample artists, places or rankings; every match
 * comes from the catalog passed in.
 */

export type SearchMode = 'all' | 'text' | 'geo' | 'audience';

export interface SearchPlace {
  kind: 'country' | 'city';
  /** Display name as typed or as found in the data. */
  label: string;
  /** ISO code for a country; for a city, the matched normalized name. */
  key: string;
}

export interface SearchOutcome {
  mode: SearchMode;
  /** Matching tracks, best first. */
  tracks: PerformanceTrack[];
  /** True when the order carries meaning (relevance, platform or audience rank). */
  ranked: boolean;
  place: SearchPlace | null;
  platform: PerformancePlatform | null;
  /** Ranking was requested but none of the matching artists has the metric. */
  missingPlatformData: boolean;
  /** Fanbase/audience was asked for but no Chartmetric entry matches the place. */
  missingAudienceData: boolean;
  /** No exact text match; results are close spellings. */
  approximate: boolean;
  /** Artist name the user probably meant. */
  suggestion: string | null;
}

const PLATFORM_WORDS: Record<string, PerformancePlatform> = {
  tiktok: 'tiktok', 'tik tok': 'tiktok',
  instagram: 'instagram', insta: 'instagram', ig: 'instagram',
  youtube: 'youtube', yt: 'youtube',
  spotify: 'spotify',
};

const RANKING_WORDS = new Set([
  'best', 'top', 'popular', 'most', 'biggest', 'largest', 'leading', 'followed', 'famous',
  'mejores', 'mejor', 'populares', 'popular', 'principales', 'meilleurs', 'meilleur', 'populaires', 'plus',
]);

/**
 * Words that ask where an artist's audience is, which switches the search to
 * Chartmetric's Instagram top countries / top cities. Normalized (no accents),
 * in English, Spanish and French.
 */
const AUDIENCE_WORDS = new Set([
  // en
  'fanbase', 'fanbases', 'fans', 'audience', 'audiences', 'engagement', 'trending',
  // es
  'fanaticada', 'audiencia', 'publico', 'seguidores', 'interaccion', 'tendencia', 'tendencias',
  // fr ("engagement", "audience" and "fans" are shared with en)
  'public', 'tendance', 'tendances',
]);

/** Connective words that never name a place, artist or platform. */
const FILLER_WORDS = new Set([
  'artist', 'artists', 'musician', 'musicians', 'singer', 'singers', 'track', 'tracks', 'song', 'songs', 'music',
  'from', 'in', 'on', 'of', 'the', 'a', 'an', 'with', 'who', 'that', 'have', 'has', 'and', 'for', 'at', 'by',
  'big', 'large', 'huge', 'strong', 'great', 'good', 'fan', 'base',
  'artista', 'artistas', 'cancion', 'canciones', 'musica', 'de', 'del', 'en', 'con', 'el', 'la', 'los', 'las',
  'un', 'una', 'que', 'tienen', 'gran', 'grande', 'mayor',
  'artiste', 'artistes', 'chanson', 'chansons', 'musique', 'du', 'des', 'le', 'les', 'sur', 'avec', 'une', 'qui',
]);

/** Lowercase, no accents or punctuation, single spaces. */
export function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** 1 for identical strings, falling toward 0 as edits pile up (Levenshtein). */
export function similarity(a: string, b: string): number {
  if (a === b) { return 1; }
  if (!a.length || !b.length) { return 0; }
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

/** Close-spelling threshold for results, and a looser one for suggestions. */
const FUZZY_MATCH = 0.8;
const FUZZY_SUGGEST = 0.7;

/**
 * How well `query` matches `field` (both normalized): 1 exact, 0.95 prefix,
 * 0.9 whole word, 0.85 substring, up to 0.8 for a close spelling, else 0.
 */
export function matchScore(query: string, field: string): number {
  if (!query || !field) { return 0; }
  if (field === query) { return 1; }
  if (field.startsWith(query)) { return 0.95; }
  if (` ${field} `.includes(` ${query} `)) { return 0.9; }
  if (query.length >= 3 && field.includes(query)) { return 0.85; }
  if (query.length < 3) { return 0; }
  return Math.min(0.8, fuzzyScore(query, field));
}

/** Best similarity between the query and the field or a same-length run of its words. */
function fuzzyScore(query: string, field: string): number {
  let best = similarity(query, field);
  const words = field.split(' ');
  const size = query.split(' ').length;
  for (let i = 0; i + size <= words.length; i++) {
    best = Math.max(best, similarity(query, words.slice(i, i + size).join(' ')));
  }
  return best >= FUZZY_MATCH ? best : 0;
}

/* ─────────── Places ─────────── */

/**
 * Demonyms that do not extend the country name, so the prefix rule in
 * resolveCountries cannot reach them ("French" is not "France…"). Regular
 * ones ("Senegalese", "mexicano", "français") need no entry. English,
 * Spanish and French; normalized (no accents, lowercase).
 */
const IRREGULAR_DEMONYMS: Record<string, string> = {
  // Africa
  'ivorian': 'CI', 'ivoirien': 'CI', 'ivoirienne': 'CI', 'marfileno': 'CI', 'marfilena': 'CI', 'marfil': 'CI',
  'congolese': 'CD,CG', 'congoleno': 'CD,CG', 'congolena': 'CD,CG', 'congolais': 'CD,CG', 'congolaise': 'CD,CG',
  'burkinabe': 'BF', 'burkinais': 'BF',
  'south african': 'ZA', 'sudafricano': 'ZA', 'sudafricana': 'ZA', 'sud africain': 'ZA', 'sud africaine': 'ZA',
  'cape verdean': 'CV', 'caboverdiano': 'CV', 'caboverdiana': 'CV', 'capverdien': 'CV', 'capverdienne': 'CV',
  'marroqui': 'MA', 'egipcio': 'EG', 'egipcia': 'EG',
  'malagasy': 'MG', 'malgache': 'MG',
  'beninese': 'BJ', 'togolese': 'TG', 'togolais': 'TG', 'togolaise': 'TG',
  'guinean': 'GN', 'gabonese': 'GA', 'gabonais': 'GA', 'gabonaise': 'GA',
  // Europe
  'french': 'FR', 'frances': 'FR', 'francesa': 'FR',
  'spanish': 'ES', 'spaniard': 'ES', 'espagnol': 'ES', 'espagnole': 'ES',
  'british': 'GB', 'english': 'GB', 'scottish': 'GB', 'welsh': 'GB', 'britanico': 'GB', 'britanica': 'GB',
  'ingles': 'GB', 'inglesa': 'GB', 'britannique': 'GB', 'anglais': 'GB', 'anglaise': 'GB',
  'dutch': 'NL', 'holandes': 'NL', 'holandesa': 'NL', 'neerlandes': 'NL', 'neerlandais': 'NL', 'hollandais': 'NL',
  'german': 'DE', 'aleman': 'DE', 'alemana': 'DE', 'allemand': 'DE', 'allemande': 'DE',
  'swiss': 'CH', 'suizo': 'CH', 'suiza': 'CH', 'suisse': 'CH',
  'belgian': 'BE', 'belga': 'BE', 'belge': 'BE',
  'portuguese': 'PT', 'portugues': 'PT', 'portuguesa': 'PT', 'portugais': 'PT', 'portugaise': 'PT',
  'irish': 'IE', 'greek': 'GR', 'griego': 'GR', 'griega': 'GR', 'grec': 'GR', 'grecque': 'GR',
  'turkish': 'TR', 'turco': 'TR', 'turca': 'TR', 'turc': 'TR', 'turque': 'TR',
  'danish': 'DK', 'danes': 'DK', 'danesa': 'DK', 'danois': 'DK', 'danoise': 'DK',
  'swedish': 'SE', 'swede': 'SE', 'sueco': 'SE', 'sueca': 'SE', 'suedois': 'SE', 'suedoise': 'SE',
  'norwegian': 'NO', 'noruego': 'NO', 'noruega': 'NO', 'norvegien': 'NO', 'norvegienne': 'NO',
  'finnish': 'FI', 'polish': 'PL', 'polaco': 'PL', 'polaca': 'PL', 'polonais': 'PL', 'polonaise': 'PL',
  'czech': 'CZ', 'checo': 'CZ', 'checa': 'CZ', 'tcheque': 'CZ', 'icelandic': 'IS', 'islandes': 'IS',
  // Americas
  'american': 'US', 'estadounidense': 'US', 'americain': 'US', 'americaine': 'US',
  'dominican': 'DO', 'dominicano': 'DO', 'dominicana': 'DO', 'dominicain': 'DO', 'dominicaine': 'DO',
  'puerto rican': 'PR', 'puertorriqueno': 'PR', 'puertorriquena': 'PR', 'boricua': 'PR', 'portoricain': 'PR',
  'salvadoran': 'SV', 'salvadoreno': 'SV', 'salvadorena': 'SV', 'salvadorien': 'SV', 'salvadorienne': 'SV',
  'costa rican': 'CR', 'costarricense': 'CR', 'costaricien': 'CR', 'costaricienne': 'CR',
  'trinidadian': 'TT', 'argentine': 'AR',
  // Asia / Middle East / Oceania
  'chinese': 'CN', 'chino': 'CN', 'china': 'CN', 'chinois': 'CN', 'chinoise': 'CN',
  'korean': 'KR', 'south korean': 'KR', 'coreano': 'KR', 'coreana': 'KR', 'coreen': 'KR', 'coreenne': 'KR',
  'filipino': 'PH', 'filipina': 'PH', 'philippin': 'PH', 'philippine': 'PH',
  'thai': 'TH', 'tailandes': 'TH', 'thailandais': 'TH', 'saudi': 'SA', 'saudita': 'SA', 'emirati': 'AE',
  'lebanese': 'LB', 'kiwi': 'NZ', 'new zealander': 'NZ',
};

/** Irregular demonym lookup, also for plurals ("Ivorians", "dominicanos"). */
function irregularDemonym(query: string): string[] {
  const forms = [query, query.replace(/es$/, ''), query.replace(/s$/, '')];
  for (const form of forms) {
    const codes = IRREGULAR_DEMONYMS[form];
    if (codes) { return codes.split(','); }
  }
  return [];
}

let countryIndexCache: Map<string, string> | null = null;

/**
 * Normalized country name -> ISO code, in English, Spanish and French, built
 * from the browser's own region names so no country list is hardcoded.
 */
function countryIndex(): Map<string, string> {
  if (countryIndexCache) { return countryIndexCache; }
  const index = new Map<string, string>();
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const names = ['en', 'es', 'fr'].map(lang => {
    try { return new Intl.DisplayNames([lang], { type: 'region' }); } catch { return null; }
  });
  for (const a of letters) {
    for (const b of letters) {
      const code = a + b;
      for (const display of names) {
        let name: string | undefined;
        try { name = display?.of(code); } catch { name = undefined; }
        if (!name || name === code) { continue; }
        const key = normalize(name);
        if (key && !index.has(key)) { index.set(key, code); }
      }
    }
  }
  countryIndexCache = index;
  return index;
}

let countryNamesCache: Map<string, string[]> | null = null;

/** ISO code -> its normalized names in English, Spanish and French. */
function countryNames(): Map<string, string[]> {
  if (countryNamesCache) { return countryNamesCache; }
  const names = new Map<string, string[]>();
  countryIndex().forEach((code, name) => names.set(code, [...(names.get(code) ?? []), name]));
  countryNamesCache = names;
  return names;
}

/** 0 exact, 1 starts with, 2 a later word starts with, 3 contains; null when no match. */
function countryMatchRank(query: string, code: string): number | null {
  let best: number | null = null;
  for (const name of countryNames().get(code) ?? []) {
    const rank = name === query ? 0
      : name.startsWith(query) ? 1
      : ` ${name}`.includes(` ${query}`) ? 2
      : query.length >= 3 && name.includes(query) ? 3
      : null;
    if (rank !== null && (best === null || rank < best)) { best = rank; }
  }
  return best;
}

export interface CountrySuggestion {
  code: string;
  /** Display name in the active language. */
  name: string;
  /** Catalog artists from this country. */
  artistCount: number;
}

/**
 * Countries for the search box as the user types: partial, case- and
 * accent-insensitive ("mex" -> Mexico, "espana" -> España), limited to
 * countries that have artists in the catalog so no suggestion is empty.
 * Exact names rank first, then names starting with the text, then names with
 * a later word starting with it, then names containing it.
 */
export function suggestCountries(raw: string, tracks: PerformanceTrack[], lang: string, limit = 6): CountrySuggestion[] {
  const query = normalize(raw);
  if (query.length < 2) { return []; }

  const artistsByCode = new Map<string, Set<string>>();
  for (const track of tracks) {
    const code = track.artist?.countryCode?.toUpperCase();
    if (!code || !track.artist) { continue; }
    artistsByCode.set(code, (artistsByCode.get(code) ?? new Set()).add(track.artist.uuid));
  }

  let display: Intl.DisplayNames | null = null;
  try { display = new Intl.DisplayNames([lang || 'en'], { type: 'region' }); } catch { display = null; }

  return [...artistsByCode.entries()]
    .map(([code, artistSet]) => ({ code, rank: countryMatchRank(query, code), artistCount: artistSet.size }))
    .filter((row): row is { code: string; rank: number; artistCount: number } => row.rank !== null)
    .map(row => ({ ...row, name: display?.of(row.code) ?? row.code }))
    .sort((a, b) => a.rank - b.rank || b.artistCount - a.artistCount || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ code, name, artistCount }) => ({ code, name, artistCount }));
}

/**
 * ISO codes for a place name: an exact country name, or a demonym that extends
 * one ("Senegalese" -> Senegal, "Mexican" -> Mexico).
 */
export function resolveCountries(text: string): string[] {
  const query = normalize(text);
  if (query.length < 3) { return []; }
  const index = countryIndex();
  const exact = index.get(query);
  if (exact) { return [exact]; }

  const irregular = irregularDemonym(query);
  if (irregular.length) { return irregular; }

  // The longest country name wins: "Nigerian" is Nigeria, not Niger.
  const codes = new Set<string>();
  let longest = 0;
  if (query.length >= 5 && !query.includes(' ')) {
    index.forEach((code, name) => {
      if (name.includes(' ') || name.length < 4 || name.length < longest) { return; }
      const stem = name.length > 5 ? name.slice(0, name.length - 1) : name;
      if (query !== name && query.startsWith(stem) && query.length - name.length <= 4) {
        if (name.length > longest) { codes.clear(); longest = name.length; }
        codes.add(code);
      }
    });
  }
  return [...codes];
}

/** Hometown of a catalog artist that the text names, if any. */
function resolveHometown(text: string, artists: PerformanceArtist[]): string | null {
  const query = normalize(text);
  if (query.length < 3) { return null; }
  let best: { key: string; score: number } | null = null;
  for (const artist of artists) {
    const town = normalize(artist.hometown);
    if (!town) { continue; }
    // "Lyon, France" also answers to "Lyon".
    const candidates = [town, normalize((artist.hometown ?? '').split(',')[0])];
    for (const candidate of candidates) {
      const score = candidate === query ? 1 : similarity(query, candidate);
      if (score >= 0.85 && (!best || score > best.score)) { best = { key: candidate, score }; }
    }
  }
  return best?.key ?? null;
}

function hometownMatches(artist: PerformanceArtist, key: string): boolean {
  const town = normalize(artist.hometown);
  if (!town) { return false; }
  return town === key || normalize((artist.hometown ?? '').split(',')[0]) === key
    || similarity(town, key) >= 0.85;
}

/* ─────────── Query reading ─────────── */

interface ParsedQuery {
  normalized: string;
  platform: PerformancePlatform | null;
  ranking: boolean;
  audience: boolean;
  /** What is left once platform, ranking, audience and filler words are gone. */
  remainder: string;
  /**
   * The words after "in" / "from" ("in Los Angeles"), kept whole so place
   * names that contain filler words survive. Null when there is no such phrase.
   */
  placePhrase: string | null;
}

/** Words that introduce a place: "in Dakar", "from Senegal", "en Dakar", "de Lyon". */
const PLACE_PREPOSITIONS = new Set(['in', 'from', 'en', 'desde', 'de', 'dans', 'a', 'au']);

/** Words after the last place preposition, with filler trimmed off the ends only. */
function placePhraseOf(words: string[]): string | null {
  for (let i = words.length - 1; i >= 0; i--) {
    if (!PLACE_PREPOSITIONS.has(words[i])) { continue; }
    const tail = words.slice(i + 1).filter(w => !PLATFORM_WORDS[w] && !RANKING_WORDS.has(w) && !AUDIENCE_WORDS.has(w));
    // Stop at the next connective ("Senegal on TikTok" -> "Senegal").
    const stop = tail.findIndex(w => w === 'on' || w === 'sur');
    const phrase = (stop >= 0 ? tail.slice(0, stop) : tail);
    while (phrase.length && FILLER_WORDS.has(phrase[phrase.length - 1])) { phrase.pop(); }
    while (phrase.length && FILLER_WORDS.has(phrase[0]) && !isPlaceArticle(phrase)) { phrase.shift(); }
    if (phrase.length) { return phrase.join(' '); }
  }
  return null;
}

/** Keeps a leading article that is part of a name ("Los Angeles", "La Paz", "Le Havre"). */
function isPlaceArticle(phrase: string[]): boolean {
  return phrase.length > 1 && ['los', 'las', 'la', 'le', 'el', 'les'].includes(phrase[0]);
}

function parseQuery(raw: string): ParsedQuery {
  let normalized = normalize(raw);
  let platform: PerformancePlatform | null = null;
  // Two-word platform names first ("tik tok").
  for (const [word, key] of Object.entries(PLATFORM_WORDS)) {
    if (word.includes(' ') && ` ${normalized} `.includes(` ${word} `)) {
      platform = key;
      normalized = ` ${normalized} `.replace(` ${word} `, ' ').trim();
    }
  }
  let ranking = false;
  let audience = /\bfan ?base\b/.test(normalized);
  const kept: string[] = [];
  for (const word of normalized.split(' ').filter(Boolean)) {
    if (PLATFORM_WORDS[word]) { platform = PLATFORM_WORDS[word]; continue; }
    if (RANKING_WORDS.has(word)) { ranking = true; continue; }
    if (AUDIENCE_WORDS.has(word)) { audience = true; continue; }
    if (FILLER_WORDS.has(word)) { continue; }
    kept.push(word);
  }
  return {
    normalized: normalize(raw),
    platform,
    ranking,
    audience,
    remainder: kept.join(' '),
    placePhrase: placePhraseOf(normalized.split(' ').filter(Boolean)),
  };
}

/* ─────────── Search ─────────── */

export function searchCatalog(tracks: PerformanceTrack[], raw: string): SearchOutcome {
  const base: SearchOutcome = {
    mode: 'all', tracks, ranked: false, place: null, platform: null,
    missingPlatformData: false, missingAudienceData: false, approximate: false, suggestion: null,
  };
  const query = parseQuery(raw);
  if (!query.normalized) { return base; }

  const artists = uniqueArtists(tracks);

  const placeText = query.placePhrase ?? query.remainder;

  // 1. Fanbase / audience intent: Chartmetric Instagram audience locations only.
  if (query.audience && placeText) {
    return audienceSearch(base, tracks, placeText);
  }

  // 2. A place, optionally with a platform ranking.
  const place = placeText ? resolvePlace(placeText, artists) : null;
  if (place) {
    const local = tracks.filter(t => t.artist && placeMatches(t.artist, place));
    if (local.length) {
      return rankByPlatform({ ...base, mode: 'geo', place, tracks: local, ranked: true }, query);
    }
    // No artist from there: the words may be a name instead ("Jamaica" the song).
    const byName = textSearch(base, tracks, artists, query.normalized);
    return byName.tracks.length ? byName : { ...base, mode: 'geo', place, tracks: [], ranked: true, platform: query.platform };
  }

  // 2b. A city in the artists' Chartmetric Instagram top cities ("Lyon").
  // Countries are handled above by artist origin; cities have no origin field
  // with data, so a city name is matched against where the audience is.
  if (placeText && !resolveCountries(placeText).length) {
    const byCity = audienceSearch(base, tracks, placeText, 'city');
    if (byCity.tracks.length) { return byCity; }
  }

  // 3. Platform ranking over the whole catalog ("best artists on TikTok").
  if (query.platform && !query.remainder) {
    return rankByPlatform({ ...base, mode: 'all', tracks, ranked: true }, query);
  }

  // 4. Track and artist names.
  const byName = textSearch(base, tracks, artists, query.normalized);
  if (byName.tracks.length && !byName.approximate) { return byName; }

  // 5. The start of a country name ("mex" -> Mexico), when no name matches
  // directly. Only countries with catalog artists count.
  const partial = countryPrefixCodes(query.normalized, artists);
  if (partial.length) {
    const place: SearchPlace = { kind: 'country', label: raw.trim(), key: partial.join(',') };
    const local = tracks.filter(t => t.artist && placeMatches(t.artist, place));
    return rankByPlatform({ ...base, mode: 'geo', place, tracks: local, ranked: true }, query);
  }
  return byName;
}

/** Codes of catalog countries whose name starts with the query (or a word in it does). */
function countryPrefixCodes(query: string, artists: PerformanceArtist[]): string[] {
  if (query.length < 3) { return []; }
  const codes = new Set(artists.map(a => a.countryCode?.toUpperCase()).filter((c): c is string => !!c));
  const ranked = [...codes]
    .map(code => ({ code, rank: countryMatchRank(query, code) }))
    .filter((row): row is { code: string; rank: number } => row.rank !== null && row.rank <= 2);
  if (!ranked.length) { return []; }
  const best = Math.min(...ranked.map(r => r.rank));
  return ranked.filter(r => r.rank === best).map(r => r.code);
}

function resolvePlace(text: string, artists: PerformanceArtist[]): SearchPlace | null {
  const codes = resolveCountries(text);
  if (codes.length) {
    return { kind: 'country', label: text, key: codes.join(',') };
  }
  const town = resolveHometown(text, artists);
  return town ? { kind: 'city', label: text, key: town } : null;
}

function placeMatches(artist: PerformanceArtist, place: SearchPlace): boolean {
  if (place.kind === 'country') {
    return !!artist.countryCode && place.key.split(',').includes(artist.countryCode.toUpperCase());
  }
  return hometownMatches(artist, place.key);
}

/** Orders by the requested platform's followers (or total audience for "best" alone). */
function rankByPlatform(outcome: SearchOutcome, query: ParsedQuery): SearchOutcome {
  const platform = query.platform;
  if (!platform && !query.ranking) {
    return { ...outcome, tracks: byArtistThenName(outcome.tracks, a => a.totalAudience) };
  }
  const metric = (a: PerformanceArtist) => (platform ? a.audience[platform] : a.totalAudience);
  const withData = outcome.tracks.filter(t => t.artist && metric(t.artist) !== null);
  return {
    ...outcome,
    platform,
    // Artists without the metric are not ranked, never treated as zero.
    tracks: byArtistThenName(withData, metric),
    missingPlatformData: outcome.tracks.length > 0 && withData.length === 0,
  };
}

/**
 * A Chartmetric city name answers to the query when it is the same city,
 * contains it as whole words ("City of London" for "London"), or is a close
 * spelling. Both sides are normalized, so case and accents never matter
 * ("montreal" finds "Montréal").
 */
export function cityMatches(cityName: string, query: string): boolean {
  const name = normalize(cityName);
  const q = normalize(query);
  if (!name || !q) { return false; }
  if (name === q) { return true; }
  if (q.length < 4) { return false; }
  return ` ${name} `.includes(` ${q} `) || similarity(name, q) >= 0.85;
}

function audienceSearch(base: SearchOutcome, tracks: PerformanceTrack[], placeText: string, only?: 'city'): SearchOutcome {
  const codes = only === 'city' ? [] : resolveCountries(placeText);
  const city = normalize(placeText);
  const kind: SearchPlace['kind'] = codes.length ? 'country' : 'city';
  const place: SearchPlace = { kind, label: placeText, key: codes.length ? codes.join(',') : city };

  // Best Chartmetric rank this artist has for the place; lower is stronger.
  const rankFor = (artist: PerformanceArtist): { rank: number; weight: number } | null => {
    const entries = kind === 'country'
      ? artist.instagramTopCountries.filter(c => codes.includes(c.code))
      : artist.instagramTopCities.filter(c => cityMatches(c.name, city));
    if (!entries.length) { return null; }
    const top = entries.reduce((a, b) => (a.rank <= b.rank ? a : b));
    return { rank: top.rank, weight: top.weight ?? 0 };
  };

  const scored = tracks
    .map(track => ({ track, score: track.artist ? rankFor(track.artist) : null }))
    .filter((row): row is { track: PerformanceTrack; score: { rank: number; weight: number } } => !!row.score)
    .sort((a, b) => a.score.rank - b.score.rank || b.score.weight - a.score.weight
      || (a.track.artist?.name ?? '').localeCompare(b.track.artist?.name ?? '') || a.track.name.localeCompare(b.track.name));

  return {
    ...base,
    mode: 'audience',
    place,
    platform: 'instagram',
    tracks: scored.map(row => row.track),
    ranked: true,
    missingAudienceData: scored.length === 0,
  };
}

function textSearch(base: SearchOutcome, tracks: PerformanceTrack[], artists: PerformanceArtist[], query: string): SearchOutcome {
  const scored = tracks
    .map(track => ({
      track,
      score: Math.max(matchScore(query, normalize(track.name)), matchScore(query, normalize(track.artist?.name))),
    }))
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || (b.track.artist?.totalAudience ?? -1) - (a.track.artist?.totalAudience ?? -1)
      || a.track.name.localeCompare(b.track.name));

  const hasDirect = scored.some(row => row.score >= 0.85);
  // Once anything matches directly, close spellings are noise.
  let results = (hasDirect ? scored.filter(row => row.score >= 0.85) : scored).map(row => row.track);
  const suggestion = hasDirect ? null : suggestArtist(query, artists);
  // Nothing close enough to list on its own: show the suggested artist rather than nothing.
  if (!results.length && suggestion) {
    results = tracks.filter(t => t.artist?.name === suggestion);
  }

  return {
    ...base,
    mode: 'text',
    tracks: results,
    ranked: true,
    approximate: !hasDirect && results.length > 0,
    suggestion,
  };
}

/** Closest artist name when the query is not one, for "Did you mean …?". */
function suggestArtist(query: string, artists: PerformanceArtist[]): string | null {
  if (query.length < 3) { return null; }
  let best: { name: string; score: number } | null = null;
  for (const artist of artists) {
    const name = normalize(artist.name);
    if (name === query) { return null; }
    const score = Math.max(similarity(query, name), fuzzyScore(query, name));
    if (score >= FUZZY_SUGGEST && (!best || score > best.score)) { best = { name: artist.name, score }; }
  }
  return best?.name ?? null;
}

function uniqueArtists(tracks: PerformanceTrack[]): PerformanceArtist[] {
  const map = new Map<string, PerformanceArtist>();
  tracks.forEach(t => { if (t.artist) { map.set(t.artist.uuid, t.artist); } });
  return [...map.values()];
}

function byArtistThenName(tracks: PerformanceTrack[], metric: (a: PerformanceArtist) => number | null): PerformanceTrack[] {
  const value = (t: PerformanceTrack) => (t.artist ? metric(t.artist) ?? -1 : -1);
  return [...tracks].sort((a, b) =>
    value(b) - value(a)
    || (a.artist?.name ?? '').localeCompare(b.artist?.name ?? '')
    || a.name.localeCompare(b.name));
}
