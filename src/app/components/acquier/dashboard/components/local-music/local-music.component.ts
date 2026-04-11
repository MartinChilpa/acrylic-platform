import { Component, ViewEncapsulation } from '@angular/core';
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
  title = 'New Local Music';
  subtitle = "What's cooking in Montreal";

  // Heights (px) for the static waveform bars
  waveBars = [4, 8, 12, 6, 10, 14, 8, 5, 12, 9, 6, 14, 10, 7, 4, 11, 8, 13, 6, 9, 12, 5, 10, 8, 14, 6, 9, 11, 4, 7];

  tracks: LocalTrack[] = [
    {
      id: '1',
      title: 'Le prix de la prax',
      artist: 'Moses Belanger, Mantisse',
      image: 'https://cdn-images.dzcdn.net/images/artist/b4ee9c909237d058e222d61c0ea4254a/1900x1900-000000-81-0-0.jpg',
      countryCode: 'ca',
      duration: '3:42',
      tier: 'preclear',
    },
    {
      id: '2',
      title: 'Viva la vida Aviva',
      artist: 'fangs',
      image: 'https://pbs.twimg.com/profile_images/1745934454227345408/lIMbaX9v_400x400.jpg',
      countryCode: 'ca',
      duration: '4:15',
      tier: 'preclear',
    },
    {
      id: '3',
      title: '3AM',
      artist: '1000joules',
      image: 'https://i.scdn.co/image/ab6761610000e5eb2a55ba31eddbe444a2b03333',
      countryCode: 'ca',
      duration: '3:58',
      tier: 'preclear',
    },
    {
      id: '4',
      title: 'Are you with me',
      artist: 'Jesse Mac Cormack, Pollena',
      image: 'https://i.scdn.co/image/ab6761610000e5eb3a840a2036cd462e5edad8c2',
      countryCode: 'ca',
      duration: '5:02',
      tier: 'preclear',
    },
    {
      id: '5',
      title: 'Demi-tour',
      artist: 'Minou',
      image: 'https://i.scdn.co/image/ab6761610000e5eba9d854e9feb88a4ec3121703',
      countryCode: 'ca',
      duration: '3:27',
      tier: 'preclear',
    },
  ];
}