import { Component, OnInit } from '@angular/core';
import { SetBackgroundImageDirective } from '../../directives/set-background-image-directive';

@Component({
  selector: 'acrylic-home',
  standalone: true,
  imports: [SetBackgroundImageDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

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


  ngOnInit(): void {
  }
}
