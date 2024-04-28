import { Component, effect, inject } from '@angular/core';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';
import { MyArtistService } from '../../../services/my-artist.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'acrylic-share-profile',
  standalone: true,
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './share-profile.component.html',
  styleUrl: './share-profile.component.scss'
})
export class ShareProfileComponent {

  private _myArtistService = inject(MyArtistService);
  myArtist: IMyArtist | undefined | null;

  linkIcon = '/assets/images/icons/link.svg';
  closeIcon = '/assets/images/icons/close.svg';

  profileShareList = [
    { picture: 'assets/images/others/jawima.png' },
    { picture: 'assets/images/others/chill-go.png' },
    { picture: 'assets/images/others/kenzie.png' },
  ];

  constructor() {
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
    })
  }

  public get profileBioTrack() {
    return [
      {
        icon: 'assets/images/icons/bolb.svg',
        link: this.myArtist?.deezer_url
      },
      {
        icon: 'assets/images/icons/spotify.svg',
        link: this.myArtist?.spotify_url
      },
      {
        icon: 'assets/images/icons/lock.svg',
        link: this.myArtist?.twitch_url
      },
      {
        icon: 'assets/images/icons/outlined-music.svg',
        link: this.myArtist?.tiktok_url
      },
      {
        icon: 'assets/images/icons/instagram.svg',
        link: this.myArtist?.instagram_url
      }
    ]
  }
}
