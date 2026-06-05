export interface IFavoriteResult {
  uuid: string;
  track_uuid: string;
  isrc: string;
  track_name: string;
  artist_name: string;
  cover_image: string;
  created: string;
}

export interface IProjectResult {
  uuid: string;
  name: string;
  description: string;
  tracks: IFavoriteResult[];
  created: string;
}
