import { Component, effect, inject } from '@angular/core';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';
import { MyArtistService } from '../../../services/my-artist.service';
import { NgOptimizedImage } from '@angular/common';
import { BackgroundImageDirective } from '../../../directives/background-image.directive';
import { IMyArtistSynclistResult } from '../../../interfaces/response/my-artist-synclist.response';
import { ArtistService } from '../../../services/artist.service';
import { ActivatedRoute } from '@angular/router';
import { ICreateTracks } from '../../../interfaces/response/create-tracks.response';
import { DurationPipe } from '../../../pipes/duration.pipe';

@Component({
  selector: 'acrylic-artist-profile',
  standalone: true,
  imports: [NgOptimizedImage, BackgroundImageDirective, DurationPipe],
  templateUrl: './artist-profile.component.html',
  styleUrl: './artist-profile.component.scss'
})
export class ArtistProfileComponent {
  myArtist: IMyArtist | undefined | null;
  artistSynclist!: IMyArtistSynclistResult[];
  displayArtistSynclist!: IMyArtistSynclistResult[];
  pinnedSynclistActiveIndex: number = 0;
  tracksActiveIndex: number = 0;
  displayTracks: any;

  slug: string = ''

  private _artistService = inject(ArtistService);
  private _activatedRoute = inject(ActivatedRoute)
  popularTrackSyncList = [
    { trackImage: 'assets/images/others/falling.png', name: 'Falling', tags: ['Lo-Fi', 'Pop'], uses: '2,374,123' },
    { trackImage: 'assets/images/others/goes.png', name: 'So It Goes', tags: ['Hip-hop', 'Synthwave'], uses: '2,017,335' },
    { trackImage: 'assets/images/others/force.png', name: 'Force', tags: ['Country', 'Jazz'], uses: '2,37,4123' },
    { trackImage: 'assets/images/others/sphera.png', name: 'Sphera', tags: ['Latin', 'R&B'], uses: '1,21,1863' },
    { trackImage: 'assets/images/others/sundown.png', name: 'Sundown', tags: ['Indie Pop'], uses: '6,87,935' },
  ];

  trackSyncList: ICreateTracks[] = [];

  ngOnInit(): void {
    this.slug = this._activatedRoute.snapshot.params['slug']
    this.getArtistProfile();
    this.getMyArtistSynclist();
  }

  getArtistProfile() {
    this._artistService.getArtistProfile(this.slug).subscribe({
      next: (response) => {
        this.myArtist = response.results[0]
        if (this.myArtist) {
          this.getArtistTracks();
        }
      }
    })
  }

  getArtistTracks() {
    this._artistService.getArtistTracks(this.myArtist?.uuid).subscribe({
      next: (response) => {
        this.trackSyncList = response.results
        this.displayTracks = this.trackSyncList.slice(0, 6);
      }
    })
  }

  getMyArtistSynclist() {
    this.artistSynclist = [
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/b4c0707d-ca5f-4b27-92b5-637623bc3148/th_1_RzHdc2v.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=URQpxMSrKSWDDRV%2FcZTgWIw4gdo%3D&Expires=1717225568",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/b4c0707d-ca5f-4b27-92b5-637623bc3148/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=4vc8BukPhi3v70MliYQgsv2%2Fg8Q%3D&Expires=1717225568",
        "name": "test",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/f8f1f91d-19ee-46a1-aa4b-1e292f9f1b32/th_1_7iHDRE0.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=8zTnWlH2KUOeBoT0JOxt%2FJZNUTU%3D&Expires=1717225568",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/f8f1f91d-19ee-46a1-aa4b-1e292f9f1b32/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=w1RkpPwWBTAItbwmzPmaLTmxpTs%3D&Expires=1717225568",
        "name": "test",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/898a2dcf-ed58-449f-bb34-ec79abc2797b/th_1_pDlgKoe.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=qp2jzs8NwHPmsuqOk3nXCN5rXsM%3D&Expires=1717225568",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/898a2dcf-ed58-449f-bb34-ec79abc2797b/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=0aJl7Gx6Gl0aL46HH9SgAeRh2D8%3D&Expires=1717225568",
        "name": "sss",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/tracks/f9bc02f0-785a-45bf-ba0e-1fafd87c0de9/album-bg.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=wi1vQfo1Lx7RF%2F4T9Kd40PJAHk8%3D&Expires=1717225568",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/tracks/f9bc02f0-785a-45bf-ba0e-1fafd87c0de9/album-cover.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=FtRDupVgqB26haggzvM4gSnb4Fw%3D&Expires=1717225568",
        "name": "Test synclist",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/3cf55d2c-37b2-402d-a35b-92bb94848b21/a1_AMui4gn.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=8YfFoIctSNWxj61j9wzSFmqc6TQ%3D&Expires=1717225568",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/3cf55d2c-37b2-402d-a35b-92bb94848b21/a1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=b9aJ6WY6HfJDa4HVWdkvtY9PlNw%3D&Expires=1717225568",
        "name": "Prueba",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/fc7dab56-29cd-41d7-8ba0-c2d13475dc36/8164310729296541559.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=%2BLbtUnBlUMLg2EYQNaiQYC3sSYM%3D&Expires=1717225568",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/fc7dab56-29cd-41d7-8ba0-c2d13475dc36/kama.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=2WfhwBBjSbCRQ1lP2zM4xeDBZQU%3D&Expires=1717225568",
        "name": "Prueba Jeremy",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/b4811c71-a061-450d-a585-6d9fc1692b6a/_DSC3432.JPG?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=bNW9LH16XbAyFlYHTiNBtcE0yCg%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/b4811c71-a061-450d-a585-6d9fc1692b6a/Early_KAM_Logo_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=FewgE%2FrVXQWHolXOpa0%2BZ%2F9j2Wg%3D&Expires=1717225569",
        "name": "Rock ur sox off",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/154b3f7d-3693-4d52-ab6b-dcd094fb67dd/th_1_Ut7F0Yb.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=IMannsL9SIlFQd5cZFrIo71r6BQ%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/154b3f7d-3693-4d52-ab6b-dcd094fb67dd/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=LuZ3AluJKsjoqkg%2FV3nD6vfBgvE%3D&Expires=1717225569",
        "name": "Test 19/05/2024",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/87e31ae6-1eb8-4b4e-8a26-c6413e3fb934/Untitled_1_LVAYb6Y.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=qFvdzRAsKXNxxB3IE73iFmGZS4s%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/87e31ae6-1eb8-4b4e-8a26-c6413e3fb934/Untitled_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=YYvy5z6nOlN9mt4mKoFpFw58Nlo%3D&Expires=1717225569",
        "name": "Test 19/05/2024",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/4a17c70a-0b5a-479c-bd92-37ebd8fb62e0/th_1_q5oIKy3.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=AC63GpwwaG2NIDO7xz85Erow354%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/4a17c70a-0b5a-479c-bd92-37ebd8fb62e0/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=S0QE805hnj3xAEKpIsthNel8BDg%3D&Expires=1717225569",
        "name": "TEST",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/984a713f-b8ce-48e6-a7c1-cf568ed7d37f/th_1_FeqCYCc.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=Gq4esgaziSGy1esOnRHobvYBQ7U%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/984a713f-b8ce-48e6-a7c1-cf568ed7d37f/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=ji5TdUpvMrxA6Oe1wlcrpv5gZVY%3D&Expires=1717225569",
        "name": "GGG",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/01e9dc19-2339-421c-9cc7-06765586943d/th_1_TkUlsOu.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=GV0yXnURKu0ORxTUjn2WxhrvOEQ%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/01e9dc19-2339-421c-9cc7-06765586943d/th_1_UY0xlLo.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=iLRkKwvG0GxqUGn4AYN6Gij%2BZzA%3D&Expires=1717225569",
        "name": "SYNC NAME IRSHAD",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/bbd6a567-bdf2-4291-b325-aacdd9568a76/Untitled_1_5o9fSXW.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=gJl9drow4yHw2nYNeWdYj0zHJH4%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/bbd6a567-bdf2-4291-b325-aacdd9568a76/Untitled_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=%2FK8rcPANUgrqdMZdJrA%2F5TiX424%3D&Expires=1717225569",
        "name": "Test 28/05",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/3c30de4a-9d88-4374-8d1b-6d9a825d7b9a/th_1_ahfPIOY.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=YsjeCxpsT6drbVAfvPi5rN%2FU3D0%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/3c30de4a-9d88-4374-8d1b-6d9a825d7b9a/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=Al93H%2Fs3QHhwUoS8O5bIcC7EL%2F0%3D&Expires=1717225569",
        "name": "Test New Add",
        "genres": []
      },
      {
        "background_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/1e519f46-6c1a-4a47-8b71-39acf2217025/th_1_ttpGKTX.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=EPf6hgt96XZ7Nr%2B8r0Z7qdauEmI%3D&Expires=1717225569",
        "cover_image": "https://s3.us-east-1.amazonaws.com/acrylic-static-pro/syncs/1e519f46-6c1a-4a47-8b71-39acf2217025/th_1.jpg?AWSAccessKeyId=AKIAU6GD2LDCO74KG2TB&Signature=p4sXpyKMu3T8CEWZ5LzffouuhXM%3D&Expires=1717225569",
        "name": "TEST IRSHAD",
        "genres": []
      }
    ] as any;
    this.displayArtistSynclist = this.artistSynclist;
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

  pinnedSynclistSlider(type: number) {
    this.pinnedSynclistActiveIndex += type;

    if (this.pinnedSynclistActiveIndex < 0) {
      this.pinnedSynclistActiveIndex = 0;
    } else if (this.pinnedSynclistActiveIndex > this.artistSynclist.length - 1) {
      this.pinnedSynclistActiveIndex = this.artistSynclist.length - 1;
    }

    this.displayArtistSynclist = this.artistSynclist.slice(this.pinnedSynclistActiveIndex, this.pinnedSynclistActiveIndex + 1);
  }

  trackSynclistSlider(type: number) {
    this.tracksActiveIndex += type;

    if (this.tracksActiveIndex < 0) {
      this.tracksActiveIndex = 0;
    } else if (this.tracksActiveIndex > this.trackSyncList.length - 6) {
      this.tracksActiveIndex = this.trackSyncList.length - 6;
    }

    this.displayTracks = this.trackSyncList.slice(this.tracksActiveIndex, this.tracksActiveIndex + 6);
  }

  public get artistLocation() {
    return [this.myArtist?.hometown, this.myArtist?.country].filter(a => a).join(', ')
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
