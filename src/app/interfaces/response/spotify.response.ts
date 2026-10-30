export interface ISpotify {
    isrc: string
    name: string
    artist: string
    spotify_id: string
    image: string
    spotify_url: string
    duration: number
}

/** One track from GET /spotify/search/ (the backend proxies Spotify search). */
export interface ISpotifySearchResult {
    name: string
    artist: string
    image: string
    spotify_url: string
    spotify_id: string
    isrc: string | null
    duration: number
}

export interface ISpotifySearchResponse {
    results: ISpotifySearchResult[]
}
