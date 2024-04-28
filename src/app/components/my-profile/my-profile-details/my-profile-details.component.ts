import { Component, inject, effect } from '@angular/core';
import { MyArtistService } from '../../../services/my-artist.service';
import { IMyArtistSynclistResult } from '../../../interfaces/response/my-artist-synclist.response';
import { NgClass, NgOptimizedImage, NgStyle } from '@angular/common';
import { BackgroundImageDirective } from '../../../directives/background-image.directive';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';

@Component({
  selector: 'acrylic-my-profile-details',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass,
    NgStyle,
    BackgroundImageDirective
  ],
  templateUrl: './my-profile-details.component.html',
  styleUrl: './my-profile-details.component.scss'
})
export class MyProfileDetailsComponent {
  plusCircleImage = 'assets/images/others/plus-circle.png';
  closeIcon = '/assets/images/icons/close.svg';
  linkIcon = '/assets/images/icons/link.svg';

  myArtist: IMyArtist | undefined | null;
  artistSynclist!: IMyArtistSynclistResult[]

  private _myArtistService = inject(MyArtistService);

  constructor(){
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
    })
  }

  ngOnInit(): void {
    this.getMyArtistSynclist();
  }

  getMyArtistSynclist() {
    this._myArtistService.getMyArtistSynclist().subscribe({
      next: (response) => {
        this.artistSynclist = response.results?.filter(s => s.pinned);
      }
    })
  }

  profileShareList = [
    { picture: 'assets/images/others/jawima.png', height: '165', translate: '35%, 15%', rotate: '-5deg', zIndex: '1' },
    { picture: 'assets/images/others/chill-go.png', height: '222', translate: '0', rotate: '0', zIndex: '5' },
    { picture: 'assets/images/others/kenzie.png', height: '165', translate: '-35%, 15%', rotate: '5deg', zIndex: '1' },
  ];

  applyShareImagesDynamicstyles(item: any) {
    return {
      'transform': `translate(${item.translate}) rotate(${item.rotate})`,
      'z-index': item.zIndex
    };
  }

  addSync() {
    // this._router.navigateByUrl('/sync-list');
  }

  public get profileBioTrack() {
    if(this.myArtist){
      return [
        {
          icon: 'assets/images/icons/bolb.svg',
          link: this.myArtist.deezer_url
        },
        {
          icon: 'assets/images/icons/spotify.svg',
          link: this.myArtist.spotify_url
        },
        {
          icon: 'assets/images/icons/lock.svg',
          link: this.myArtist.twitch_url
        },
        {
          icon: 'assets/images/icons/outlined-music.svg',
          link: this.myArtist.tiktok_url
        },
        {
          icon: 'assets/images/icons/instagram.svg',
          link: this.myArtist.instagram_url
        }
      ]
    }
    else return [];
  }

  public get artistLocation() {
    return [this.myArtist?.hometown, this.myArtist?.country].filter(a => a).join(', ')
  }
}
