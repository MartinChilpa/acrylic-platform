import { IMyArtist } from "./my-artist.response";

export interface IArtistResponse {
    count: number
    next: any
    previous: any
    results: IArtist[]
}

export interface IArtist extends IMyArtist{

}