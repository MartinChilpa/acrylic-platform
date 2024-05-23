import { IPrice } from "./price.response"

export interface ICreateTracks {
    id: number
    artist: string
    tags: any[]
    genres: any[]
    additional_main_artists: any[]
    featured_artists: any[]
    uuid: string
    created: string
    updated: string
    isrc: string
    name: string
    duration: any
    released: any
    is_cover: boolean
    is_remix: boolean
    is_instrumental: boolean
    is_explicit: boolean
    record_type: string
    bpm: any
    language: string
    lyrics: string
    cover_image: any
    snippet: any
    file_wav: any
    file_mp3: any
    distributor: any
    other_distributor: string
    other_distributor_email: string
    price: IPrice
}