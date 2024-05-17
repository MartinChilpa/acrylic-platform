import { Component, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { BackgroundImageDirective } from '../../directives/background-image.directive';
import { IAcrylicHomeResult } from '../../interfaces/response/home.response';
import { NgClass } from '@angular/common';
import { ArticlesService } from '../../services/articles.service';

@Component({
  selector: 'acrylic-home',
  standalone: true,
  imports: [BackgroundImageDirective, NgClass],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  public _myArtistService = inject(MyArtistService);
  public _articlesService = inject(ArticlesService);
  homeDataList: IAcrylicHomeResult[] = [];
  
  topTrack = [
    { name: 'Chill Vibes Café', price: '24,876' , imageLink:'assets/images/others/top-track.png'},
    { name: 'Chill Vibes Café', price: '24,876' , imageLink:'assets/images/others/top-track.png'},
    { name: 'Chill Vibes Café', price: '24,876' , imageLink:'assets/images/others/top-track.png'},
    { name: 'Chill Vibes Café', price: '24,876' , imageLink:'assets/images/others/top-track.png'},
    { name: 'Chill Vibes Café', price: '24,876' , imageLink:'assets/images/others/top-track.png'}
  ];
  topArtist = [
    {name: 'Lily Johnson', price: '24,876', imageLink:'assets/images/others/artist.png'},
    {name: 'Marcus Davis', price: '24,876', imageLink:'assets/images/others/artist.png'},
    {name: 'Savannah Carter', price: '24,876', imageLink:'assets/images/others/artist.png'},
    {name: 'Chill Vibes Café', price: '24,876', imageLink:'assets/images/others/artist.png'},
    {name: 'Chill Vibes Café', price: '24,876', imageLink:'assets/images/others/artist.png'}
  ];

  ngOnInit() {
    this._articlesService.getAcrylicHomeList().subscribe({
      next: (response) => {
        this.homeDataList = response?.results;
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
