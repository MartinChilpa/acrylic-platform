import { Component, Input, effect, inject } from '@angular/core';
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

  @Input() profileBioTrack:any = [];
  @Input() myArtist!:IMyArtist;;

  linkIcon = '/assets/images/icons/link.svg';
  closeIcon = '/assets/images/icons/close.svg';

  profileShareList = [
    { picture: 'assets/images/others/jawima.png' },
    { picture: 'assets/images/others/chill-go.png' },
    { picture: 'assets/images/others/kenzie.png' },
  ];
}
