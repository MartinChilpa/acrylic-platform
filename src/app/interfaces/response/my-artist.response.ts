export interface IMyArtist {
    uuid: string;
    created: string;
    updated: string;
    name: string;
    bio: string;
    hometown: string;
    country: string;
    image: string;
    background_image: string;
    chartmetric_id: string;
    spotify_url: string | null;
    tiktok_url: string | null;
    twitter_url: string | null;
    youtube_url: string | null;
    twitch_url: string | null;
    facebook_url: string | null;
    shazam_url: string | null;
    soundcloud_url: string | null;
    pandora_url: string | null;
    instagram_url: string | null;
    itunes_url: string | null;
    amazonmusic_url: string | null;
    deezer_url: string | null;
    is_active: boolean;
    user: number;
}