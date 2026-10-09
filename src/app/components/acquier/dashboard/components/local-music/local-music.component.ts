import { Component, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { TeamBrandingService } from '../../../../../services/team-branding.service';

export interface LocalTrack {
  id: string;
  title: string;
  artist: string;
  image: string;
  countryCode: string;
  duration?: string;
  tier: 'bid2clear' | 'preclear' | 'artistpromo';
  /**
   * Spotify track URL (https://open.spotify.com/track/{id}) the card links to,
   * as the seed of a similarity search. An empty value leaves the card inert
   * rather than linking to a search that cannot work.
   */
  spotifyUrl: string;
}

/** FMF's club_club.slug in production (club id 232). */
const FMF_TEAM_SLUG = 'fmf';

@Component({
  selector: 'acrylic-local-music',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslocoModule],
  templateUrl: './local-music.component.html',
  styleUrl: './local-music.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LocalMusicComponent {
  /** Where a card points: the dashboard, seeded with the track's Spotify URL. */
  readonly searchRoute = ['/brand/dashboard'];

  // Heights (px) for the static waveform bars
  waveBars = [4, 8, 12, 6, 10, 14, 8, 5, 12, 9, 6, 14, 10, 7, 4, 11, 8, 13, 6, 9, 12, 5, 10, 8, 14, 6, 9, 11, 4, 7];

  private readonly brandingService = inject(TeamBrandingService);

  /** Tracks every club sees unless it has its own list below. */
  private readonly defaultTracks: LocalTrack[] = [
    {
      id: '1',
      title: 'Adriano',
      artist: 'Ameka Zrai',
      image: 'https://mixdecale.com/wp-content/uploads/2026/05/ameka-zrai-mixdecale.jpg',
      countryCode: 'ci',
      tier: 'artistpromo',
      spotifyUrl: 'https://open.spotify.com/track/3BSbM6PrlqWHRL2uci4kAz',
    },
    {
      id: '2',
      title: 'NAS',
      artist: 'Didi B',
      image: 'https://skinfama.com/wp-content/uploads/2023/09/Didi-B-1-1024x1024.jpeg',
      countryCode: 'ci',
      tier: 'artistpromo',
      spotifyUrl: 'https://open.spotify.com/track/14JrzA7c0TIadyyTQV5EbG',
    },
   {
      id: '3',
      title: 'Sans Pression',
      artist: 'Himra',
      image: 'https://cdn.prod.website-files.com/6486dfb1011e5a5c884cf4da/69d4e7fef43fd3a0a180dd60_470326014_18472340152053191_4515865898048579381_n.jpg',
      countryCode: 'ci',
      tier: 'artistpromo',
      spotifyUrl: 'https://open.spotify.com/track/7BWvwfXFMccNg7kDXOY3zT',
    },
{
      id: '4',
      title: 'Ye Mama',
      artist: 'Toofan',
      image: 'https://cdn-images.dzcdn.net/images/artist/60e7c9d880ed722a3ac6d0f8f25f944d/1900x1900-000000-80-0-0.jpg',
      countryCode: 'tg',
      tier: 'artistpromo',
      spotifyUrl: 'https://open.spotify.com/track/3PAzEetw66fMHrSSenUTf7',
    },
 {
      id: '5',
      title: 'Kabableke',
      artist: 'Serge Beynaud',
      image: 'https://bookingagentinfo.com/wp-content/uploads/2024/02/ab6761610000e5ebcdea6c7145cb5dfd5930512b.jpg',
      countryCode: 'ci',
      tier: 'artistpromo',
      spotifyUrl: 'https://open.spotify.com/track/7ac7FoJJ4sKB9b02lBq5wG',
    },
  ];

  /**
   * Club-specific lists, keyed by club slug (club_club.slug). The slug comes
   * from the club sign-in URL (/auth/:teamSlug/sign-in), so a club member who
   * signs in through the generic page sees the default list.
   */
  private readonly tracksByClub: Record<string, LocalTrack[]> = {
    [FMF_TEAM_SLUG]: [
      {
        id: 'fmf-1',
        title: 'San Lucas',
        artist: 'Kevin Kaarl',
        image: 'https://es.rollingstone.com/wp-content/uploads/2023/05/Kevin-Kaarl-y-el-valor-de-la-vulnerabilidad-4.jpg',
        countryCode: 'mx',
        tier: 'artistpromo',
        spotifyUrl: 'https://open.spotify.com/track/3aZxnqYFM8UI2jLgUD3B2a',
      },
      {
        id: 'fmf-2',
        title: 'Siempre me cuesta regresar',
        artist: 'La Texana',
        image: 'https://gritaradio.com/wp-content/uploads/2025/04/La-Casa-Que-Cae-el-LP-debut-de-La-Texana-scaled.jpg',
        countryCode: 'mx',
        tier: 'artistpromo',
        spotifyUrl: 'https://open.spotify.com/track/1YcHOSxfZmFrpIhl32GdQH',
      },
      {
        id: 'fmf-3',
        title: 'MUÑEKITAS',
        artist: 'LA VIRGENCITA',
        image: 'https://i0.wp.com/dcocote.com/wp-content/uploads/2026/02/la-virgencita-pegameeeeento-foto-prensa-1.jpg?resize=1767%2C1180&ssl=1',
        countryCode: 'mx',
        tier: 'artistpromo',
        spotifyUrl: 'https://open.spotify.com/track/01nlB0VAo2vxgj21J5V2eK',
      },
      {
        id: 'fmf-4',
        title: 'ella llora',
        artist: 'sobresdylan',
        image: 'https://tercerparlante.com/wp-content/uploads/2026/10/sobresdylan-2026-73599.webp',
        countryCode: 'mx',
        tier: 'artistpromo',
        spotifyUrl: 'https://open.spotify.com/track/7AEgJUtqE0TH4S4rdu3Nsd',
      },
      {
        id: 'fmf-5',
        title: 'Me haces bien',
        artist: 'Palmasur',
        image: 'https://revistakuadro.com/wp-content/uploads/2022/02/271994877_1656645158021699_1257988327789570717_n.jpeg',
        countryCode: 'mx',
        tier: 'artistpromo',
        spotifyUrl: 'https://open.spotify.com/track/0GlC70q5XuY6h9IYeqxxtt',
      },
    ],
  };

  readonly tracks: LocalTrack[] =
    this.tracksByClub[this.brandingService.getStoredTeamSlugOrNull() ?? ''] ?? this.defaultTracks;

  isSearchable(track: LocalTrack): boolean {
    return !!(track.spotifyUrl ?? '').trim();
  }

  searchParams(track: LocalTrack): Record<string, string> {
    return { q: (track.spotifyUrl ?? '').trim() };
  }
}
