import { IMyArtistSynclistResult } from './../../interfaces/response/my-artist-synclist.response';
import { ICommonSuccessResponse } from './../../interfaces/response/common.response';
import { IMyArtist } from './../../interfaces/response/my-artist.response';
import { Component, effect, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { BackgroundImageDirective } from '../../directives/background-image.directive';
import { IAcrylicHomeResult } from '../../interfaces/response/home.response';
import { NgClass } from '@angular/common';
import { ArticlesService } from '../../services/articles.service';
import { ArtistService } from '../../services/artist.service';
import { SynclistService } from '../../services/synclist.service';

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
  private _synclistService = inject(SynclistService);

  myArtist: IMyArtist | undefined | null;
  homeDataList: IAcrylicHomeResult[] = [];
  newArtists: IMyArtist[] = [];
  latestSyncs: IMyArtistSynclistResult[] = [];

  constructor() {
    effect(() => {
      this.myArtist = this._myArtistService.myArtist();
    })
  }

  ngOnInit() {
    this.getArticles();
    this.getNewArtists();
    this.getLatestSyncs();
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
      next: (response: ICommonSuccessResponse<IMyArtist[]>) => {
        this.newArtists = response.results;
      }
    });
  }

  getLatestSyncs():void{
    this._synclistService.getLatestSyncs().subscribe({
      next: (response: ICommonSuccessResponse<IMyArtistSynclistResult[]>) => {
        this.latestSyncs = response.results;
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
