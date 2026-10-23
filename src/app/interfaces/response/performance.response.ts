/* ─────────── Raw API rows (GET /tracks/, /artists/, /prices/) ─────────── */

export interface IPerformanceTrackResult {
  uuid: string;
  isrc: string;
  /** Artist uuid. */
  artist: string;
  name: string;
  duration: number | null;
  /** Price uuid; resolves to a tier through /prices/. */
  price: string | null;
  extended_commercial_use: boolean;
  /** Not on the public serializer yet; read when the backend adds them. */
  spotify_streams?: number | null;
  /** Signed, expiring URL for catalog_track.file_wav (backend: TrackSerializer.preview_url). */
  preview_url?: string | null;
  /** Older name for the same thing; read as a fallback. */
  audio_url?: string | null;
  cover_image?: string | null;
}

/** One entry of artist_artist.chartmetric_instagram_top_countries. */
export interface IChartmetricCountry {
  code2: string;
  name?: string;
  rank: number;
  weights?: number;
}

/** One entry of artist_artist.chartmetric_instagram_top_cities. */
export interface IChartmetricCity {
  city_name: string;
  code2?: string;
  rank: number;
  weights?: number;
}

export interface IPerformanceArtistResult {
  uuid: string;
  name: string;
  /** ISO 3166-1 alpha-2 code. */
  country: string | null;
  hometown: string | null;
  updated: string;
  chartmetric_instagram_top_countries: IChartmetricCountry[] | null;
  chartmetric_instagram_top_cities: IChartmetricCity[] | null;
  tiktok_followers: number | null;
  instagram_followers: number | null;
  youtube_followers: number | null;
  spotify_followers: number | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
}

export interface IPerformancePriceResult {
  uuid: string;
  name: string;
}

/* ─────────── View model ─────────── */

export type PerformancePlatform = 'tiktok' | 'instagram' | 'youtube' | 'spotify';

export type PerformanceTier = 'PreClear' | 'Artist Promo';

export interface PerformanceArtist {
  uuid: string;
  name: string;
  countryCode: string | null;
  /** City the artist is from, as stored in artist_artist.hometown. */
  hometown: string | null;
  /**
   * Where the artist's Instagram audience is, per Chartmetric. Ranks only:
   * these are the artist's top locations, not audience sizes.
   */
  instagramTopCountries: { code: string; rank: number; weight: number | null }[];
  instagramTopCities: { name: string; code: string | null; rank: number; weight: number | null }[];
  /** Follower count per platform; null where the source has no number. */
  audience: Record<PerformancePlatform, number | null>;
  /** Sum of the platform counts, null when none is known. Not unique reach. */
  totalAudience: number | null;
  largestPlatform: PerformancePlatform | null;
  profileUrls: Record<PerformancePlatform, string | null>;
  updated: Date | null;
}

export interface PerformanceTrack {
  uuid: string;
  isrc: string;
  name: string;
  artistUuid: string;
  /** Null when the artist is inactive or missing from /artists/. */
  artist: PerformanceArtist | null;
  tier: PerformanceTier;
  extendedCommercialUse: boolean;
  /** Per-track streams are not stored yet, so this is usually null. */
  spotifyStreams: number | null;
  previewUrl: string | null;
  /** catalog_track.cover_image, once the tracks endpoint returns it. */
  coverUrl: string | null;
}

export interface PerformanceCatalog {
  tracks: PerformanceTrack[];
  /** Most recent artist update, used for "Data updated". */
  updated: Date | null;
}
