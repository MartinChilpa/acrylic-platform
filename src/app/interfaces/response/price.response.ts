export interface IPrice {
  uuid: string;
  name: string;
  description: string;
  max_artist_tracks: number;
  default: boolean;
  active: boolean;
  order: number;
  min_price: number;
  max_price: number;
  available_tracks: any;
}
