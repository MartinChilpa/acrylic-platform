import { Component, OnInit, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { BackgroundImageDirective } from '../../directives/background-image.directive';

@Component({
  selector: 'acrylic-home',
  standalone: true,
  imports: [BackgroundImageDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  public _myArtistService = inject(MyArtistService);

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

  mainImage = 'assets/images/others/main.jpg';
  mdCard1 = 'assets/images/others/ms1.png';
  mdCard2 = 'assets/images/others/ms2.png';
  smCard1 = 'assets/images/others/sm1.png';
  smCard2 = 'assets/images/others/sm2.png';
  smCard3 = 'assets/images/others/sm3.png';
}
