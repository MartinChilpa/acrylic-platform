import { Component, inject, effect } from '@angular/core';
import { MyArtistService } from '../../../services/my-artist.service';
import { IMyArtistSynclistResult } from '../../../interfaces/response/my-artist-synclist.response';
import { NgOptimizedImage } from '@angular/common';
import { BackgroundImageDirective } from '../../../directives/background-image.directive';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';
import { NavigationService } from '../../../services/navigation.service';
import { ShareProfileComponent } from '../share-profile/share-profile.component';

@Component({
  selector: 'acrylic-my-profile-details',
  standalone: true,
  imports: [
    NgOptimizedImage,
    BackgroundImageDirective,
    ShareProfileComponent
  ],
  templateUrl: './my-profile-details.component.html',
  styleUrl: './my-profile-details.component.scss'
})
export class MyProfileDetailsComponent {
  plusCircleImage = 'assets/images/others/plus-circle.png';

  myArtist: IMyArtist | undefined | null;
  artistSynclist!: IMyArtistSynclistResult[]

  private _myArtistService = inject(MyArtistService);
  private _navigationService = inject(NavigationService);

  constructor() {
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

  addSync() {
    this._navigationService.navigateToSyncList();
  }

  editSynclist(item: IMyArtistSynclistResult) {
    this._navigationService.navigateToEditSyncList(item.uuid);
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

  public get artistLocation() {
    return [this.myArtist?.hometown, this.myArtist?.country].filter(a => a).join(', ')
  }

  getGenres(): string {
    let genresString = '';
    if (this.artistSynclist) {
      this.artistSynclist.forEach((item, index) => {
        if (item.genres) {
          item.genres.forEach((genre, genreIndex) => {
            genresString += genre.name;
            if (genreIndex !== item.genres.length - 1) {
              genresString += ', ';
            }
          });
        }
      });
    }
    return genresString;
  }

}
