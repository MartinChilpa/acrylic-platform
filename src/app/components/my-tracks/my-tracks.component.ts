import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MyArtistService } from '../../services/my-artist.service';
import { ICreateTracks } from '../../interfaces/response/create-tracks.response';
import { NavigationService } from '../../services/navigation.service';
import { CustomDropdownComponent } from '../shared/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'acrylic-my-tracks',
  standalone: true,
  imports: [NgOptimizedImage, NgClass, CustomDropdownComponent],
  templateUrl: './my-tracks.component.html',
  styleUrl: './my-tracks.component.scss'
})
export class MyTracksComponent implements OnInit {
  myTracksTableList = [
    { trackImage: 'assets/images/others/falling.png', name: 'Falling', totalTrack: { totalUsers: '45,567', totalPercentage: '+11.43%' }, assignedTags: ['Lo-Fi', 'Happy', 'Cooking', 'Shopping'], priceTag: { picture: 'assets/images/others/beat.png', priceTageName: 'Contact Us', priceStartDate: 'Feb 6, 2024', priceEndDate: 'Feb 6, 2024', bgClass: 'bg-info' }, popularTags: ['Lo-Fi', 'Happy', 'Cooking'], releaseDate: 'Oct 4, 2023', trackStatus: 'Open Track' },
    { trackImage: 'assets/images/others/goes.png', name: 'So It Goes', totalTrack: { totalUsers: '39,748', totalPercentage: '+3.12%' }, assignedTags: ['Hip-hop', 'Lo-Fi', 'Happy', 'Cooking', 'Shopping'], priceTag: { picture: 'assets/images/others/beat.png', priceTageName: 'Premium', priceStartDate: 'Feb 6, 2024', priceEndDate: 'Feb 6, 2024', bgClass: 'bg-blue' }, popularTags: ['Hip-hop', 'Lo-Fi', 'Happy'], releaseDate: 'Oct 4, 2023', trackStatus: 'Open Track' },
    { trackImage: 'assets/images/others/force.png', name: 'Force', totalTrack: { totalUsers: '45,567', totalPercentage: '+11.43%' }, assignedTags: ['Country', 'Happy', 'Cooking', 'Shopping'], priceTag: { picture: 'assets/images/others/beat.png', priceTageName: 'Basic', priceStartDate: 'Feb 6, 2024', priceEndDate: 'Feb 6, 2024', bgClass: 'bg-lightgray-border' }, popularTags: ['Country', 'Happy', 'Cooking'], releaseDate: 'Oct 4, 2023', trackStatus: 'Open Track' },
    { trackImage: 'assets/images/others/sphera.png', name: 'Sphera', totalTrack: { totalUsers: '39,748', totalPercentage: '+3.12%' }, assignedTags: ['Lo-Fi', 'Happy', 'Cooking', 'Shopping'], priceTag: { picture: 'assets/images/others/beat.png', priceTageName: 'Basic', priceStartDate: 'Feb 6, 2024', priceEndDate: 'Feb 6, 2024', bgClass: 'bg-lightgray-border' }, popularTags: ['Lo-Fi', 'Happy', 'Cooking'], releaseDate: 'Oct 4, 2023', trackStatus: 'Open Track' },
    { trackImage: 'assets/images/others/sundown.png', name: 'Sundown', totalTrack: { totalUsers: '45,567', totalPercentage: '+11.43%' }, assignedTags: ['Indie Pop', 'Happy', 'Cooking', 'Shopping'], priceTag: { picture: 'assets/images/others/beat.png', priceTageName: 'Basic', priceStartDate: 'Feb 6, 2024', priceEndDate: 'Feb 6, 2024', bgClass: 'bg-lightgray-border' }, popularTags: ['Indie Pop', 'Happy', 'Cooking'], releaseDate: 'Oct 4, 2023', trackStatus: 'Open Track' },
  ]
  trackList: ICreateTracks[] = []
  private _myArtistService = inject(MyArtistService);
  public _navigationService = inject(NavigationService);

  ngOnInit(): void {
    this.getTracks()
  }

  getTracks() {
    this._myArtistService.getTracks().subscribe({
      next: response => {
        this.trackList = response
      }
    })
  }

  openTrack(id: string) {
    this._navigationService.navigateToEditTracks(id)
  }
}
