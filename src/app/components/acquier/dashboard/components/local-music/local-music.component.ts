import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LocalTrack {
  id: string;
  title: string;
  artist: string;
  image: string;
  countryCode: string;
  duration: string;
  tier: 'bid2clear' | 'preclear' | 'artistpromo';
}

@Component({
  selector: 'acrylic-local-music',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './local-music.component.html',
  styleUrl: './local-music.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LocalMusicComponent {
  title = 'New Music by Region';

  // Heights (px) for the static waveform bars
  waveBars = [4, 8, 12, 6, 10, 14, 8, 5, 12, 9, 6, 14, 10, 7, 4, 11, 8, 13, 6, 9, 12, 5, 10, 8, 14, 6, 9, 11, 4, 7];

  tracks: LocalTrack[] = [
    {
      id: '1',
      title: 'No Signal Zone',
      artist: 'Soul Jungle',
      image: 'https://i.scdn.co/image/ab6761610000e5ebf8b0c80d26401a1f91016fc5',
      countryCode: 'sn',
      duration: '2:17',
      tier: 'artistpromo',
    },
    {
      id: '2',
      title: 'Open a Door',
      artist: 'Boztown',
      image: 'https://lastfm.freetls.fastly.net/i/u/ar0/b83844231cf0c97c121d599ffb9596c2.jpg',
      countryCode: 'fr',
      duration: '3:13',
      tier: 'artistpromo',
    },
    {
      id: '3',
      title: 'Barca Breeze',
      artist: 'Rosia!',
      image: 'https://i.scdn.co/image/ab6761610000e5ebcd6a74ebd0df02840654b19c',
      countryCode: 'gb',
      duration: '2:44',
      tier: 'artistpromo',
    },
    {
      id: '4',
      title: 'Are you with me',
      artist: 'Jesse Mac Cormack, Pollena',
      image: 'https://i.scdn.co/image/ab6761610000e5eb3a840a2036cd462e5edad8c2',
      countryCode: 'jp',
      duration: '5:02',
      tier: 'preclear',
    },
    {
      id: '5',
      title: 'Pangolin',
      artist: 'Em9',
      image: 'https://i.scdn.co/image/ab6761610000e5eb1808b725a89d5ddc172201c8',
      countryCode: 'es',
      duration: '2:55',
      tier: 'artistpromo',
    },
  ];
}