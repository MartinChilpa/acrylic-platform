import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

export interface LocalTrack {
  id: string;
  title: string;
  artist: string;
  image: string;
  countryCode: string;
  duration?: string;
  tier: 'bid2clear' | 'preclear' | 'artistpromo';
}

@Component({
  selector: 'acrylic-local-music',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './local-music.component.html',
  styleUrl: './local-music.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LocalMusicComponent {
  // Heights (px) for the static waveform bars
  waveBars = [4, 8, 12, 6, 10, 14, 8, 5, 12, 9, 6, 14, 10, 7, 4, 11, 8, 13, 6, 9, 12, 5, 10, 8, 14, 6, 9, 11, 4, 7];

  tracks: LocalTrack[] = [
    {
      id: '1',
      title: 'Adriano',
      artist: 'Ameka Zrai',
      image: 'https://mixdecale.com/wp-content/uploads/2026/05/ameka-zrai-mixdecale.jpg',
      countryCode: 'ci',
      tier: 'artistpromo',
    },
    {
      id: '2',
      title: 'NAS',
      artist: 'Didi B',
      image: 'https://skinfama.com/wp-content/uploads/2023/09/Didi-B-1-1024x1024.jpeg',
      countryCode: 'ci',
      tier: 'artistpromo',
    },
   {
      id: '3',
      title: 'Sans Pression',
      artist: 'Himra',
      image: 'https://cdn.prod.website-files.com/6486dfb1011e5a5c884cf4da/69d4e7fef43fd3a0a180dd60_470326014_18472340152053191_4515865898048579381_n.jpg',
      countryCode: 'ci',
      tier: 'artistpromo',
    },
{
      id: '4',
      title: 'Ye Mama',
      artist: 'Toofan',
      image: 'https://cdn-images.dzcdn.net/images/artist/60e7c9d880ed722a3ac6d0f8f25f944d/1900x1900-000000-80-0-0.jpg',
      countryCode: 'tg',
      tier: 'artistpromo',
    },
 {
      id: '5',
      title: 'Kabableke',
      artist: 'Serge Beynaud',
      image: 'https://bookingagentinfo.com/wp-content/uploads/2024/02/ab6761610000e5ebcdea6c7145cb5dfd5930512b.jpg',
      countryCode: 'ci',
      tier: 'artistpromo',
    },
  ];
}