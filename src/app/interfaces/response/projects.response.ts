export interface IFavoriteResult {
  uuid: string;
  track_id?: number;
  track_uuid: string;
  isrc: string;
  track_name: string;
  artist_name: string;
  cover_image: string;
  created: string;
  /** Full track payload returned by the favorites API for waveform and metrics. */
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

/** A track inside a project (backend: ClubProjectTrackSerializer). */
export interface IProjectTrack {
  track_uuid: string;
  isrc: string;
  track_name: string;
  artist_name: string;
  cover_image: string;
  created: string;
  /** Rich snapshot attached on the client when one is known. */
  track?: any;
}

export interface IProjectResult {
  uuid: string;
  name: string;
  description: string;
  track_count?: number;
  tracks: IProjectTrack[];
  created: string;
}

/** Where a club keeps one track: Saved tracks and any number of projects. */
export interface ITrackDestinations {
  track_uuid: string;
  saved: boolean;
  project_uuids: string[];
}

/** add: union, never removes. set: exactly these destinations (edit, undo). */
export type DestinationsMode = 'add' | 'set';
