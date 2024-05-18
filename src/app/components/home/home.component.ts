import { IMyArtist } from './../../interfaces/response/my-artist.response';
import { Component, effect, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { BackgroundImageDirective } from '../../directives/background-image.directive';
import { IAcrylicHomeResult } from '../../interfaces/response/home.response';
import { NgClass } from '@angular/common';
import { ArticlesService } from '../../services/articles.service';
import { ArtistService } from '../../services/artist.service';
import { IArtist, IArtistResponse } from '../../interfaces/response/artist.response';

@Component({
  selector: 'acrylic-home',
  standalone: true,
  imports: [BackgroundImageDirective, NgClass],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  private _articlesService = inject(ArticlesService);
  private _myArtistService = inject(MyArtistService);
  private _artistService = inject(ArtistService);

  myArtist: IMyArtist | undefined | null;
  homeDataList: IAcrylicHomeResult[] = [];
  newArtists: IArtist[] = [];
  topTrack = [
    { name: 'Chill Vibes Café', price: '24,876', imageLink: 'assets/images/others/top-track.png' },
    { name: 'Chill Vibes Café', price: '24,876', imageLink: 'assets/images/others/top-track.png' },
    { name: 'Chill Vibes Café', price: '24,876', imageLink: 'assets/images/others/top-track.png' },
    { name: 'Chill Vibes Café', price: '24,876', imageLink: 'assets/images/others/top-track.png' },
    { name: 'Chill Vibes Café', price: '24,876', imageLink: 'assets/images/others/top-track.png' }
  ];

  constructor() {
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
    })
  }

  ngOnInit() {
    this.getArticles();
    this.getNewArtists();
  }

  getArticles():void{
    this._articlesService.getAcrylicHomeList().subscribe({
      next: (response) => {
        this.homeDataList = response?.results;
      }
    });
  }

  getNewArtists():void{
    this._artistService.getNewArtists().subscribe({
      next: (response: IArtistResponse) => {
        this.newArtists = response.results;
      }
    });
  }

  calculateColumnSizes(numObjects: number): number[] {
    let colSizes = [];
    switch (numObjects) {
      case 1:
        colSizes = [12];
        break;
      case 2:
        colSizes = [12, 12];
        break;
      case 3:
        colSizes = [12, 6, 6];
        break;
      case 4:
        colSizes = [12, 4, 4, 4];
        break;
      case 5:
        colSizes = [12, 6, 6, 6, 6];
        break;
      case 6:
        colSizes = [12, 6, 6, 4, 4, 4];
        break;
      default:
        colSizes = [12, 6, 6, 4, 4, 4];
        for (let i = 6; i < numObjects; i++) {
          colSizes.push(4);
        }
        break;
    }
    return colSizes;
  }
}
