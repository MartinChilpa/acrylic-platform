export interface IFavoriteResult {
  uuid: string;
  track_id?: number;
  track_uuid: string;
  isrc: string;
  track_name: string;
  artist_name: string;
  cover_image: string;
  created: string;
  /** Full track snapshot so rich UI (waveform, metrics, tier) can render later. */
  track?: any;
}

export interface ILicenseResult {
  uuid: string;
  track_id?: number;
  track_uuid: string;
  isrc: string;
  track_name: string;
  artist_name: string;
  cover_image: string;
  extended_commercial_use: boolean;
  total_price: string;
  created: string;
  updated: string;
}

export interface IProjectResult {
  uuid: string;
  name: string;
  description: string;
  tracks: IFavoriteResult[];
  created: string;
}
