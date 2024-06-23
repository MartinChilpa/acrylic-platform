import { Component, Input } from '@angular/core';
import { IMyArtist } from '../../../interfaces/response/my-artist.response';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'acrylic-share-profile',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './share-profile.component.html',
  styleUrl: './share-profile.component.scss'
})
export class ShareProfileComponent {

  @Input() profileBioTrack: any = [];
  @Input() myArtist!: IMyArtist;

  isCopied: boolean = false;

  linkIcon = '/assets/images/icons/link.svg';

  profileShareList = [
    { picture: 'assets/images/others/jawima.png' },
    { picture: 'assets/images/others/chill-go.png' },
    { picture: 'assets/images/others/kenzie.png' },
  ];

  getSlug() {
    return `${environment.APP_URL}/artist/${this.myArtist.slug}`;
  }

  copyToClipboard(item: string) {
    navigator.clipboard.writeText(item);
    this.isCopied = true;
  }

}
