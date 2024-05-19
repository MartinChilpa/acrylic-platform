export interface IMyArtistSynclistResult {
    uuid: string
    artist: string
    name: string
    cover_image: string
    background_image: string
    description: string
    order: number
    pinned: boolean
    tracks: Track[],
    genres: Genre[],
    tags: Tag[]
}

export interface Track {
    track: TrackDetail
    order: number
}

export interface TrackDetail {
    uuid: string
    isrc: string
    artist: string
    name: string
    duration?: number
    released?: string
    is_cover: boolean
    is_remix: boolean
    is_instrumental: boolean
    is_explicit: boolean
    record_type: string
    bpm?: number
    language: string
    lyrics: string
    distributor: any
    snippet?: string
    genres: Genre[]
    additional_main_artists: any[]
    featured_artists: any[]
    tags: Tag[]
    master_splits: any[]
}

export interface Genre {
    uuid: string
    name: string
    code: string
}

export interface Tag {
    name: string
    slug: string
}
