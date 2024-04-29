import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';

@Component({
  selector: 'acrylic-add-synclist',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FileDropzoneComponent
  ],
  templateUrl: './add-synclist.component.html',
  styleUrl: './add-synclist.component.scss'
})
export class AddSynclistComponent {
  fileDropzoneIcon = '/assets/images/icons/drop.svg'
  fileDropzoneHeader = 'Drop your Cover Art File here or upload it manually';
  fileDropzoneSize = 'JPG 1920px x 1080px';
  private _navigationService = inject(NavigationService);

  trackSyncList = [
    { trackImage: 'assets/images/others/falling.png', name: 'Falling', tags: ['Lo-Fi', 'Pop'] },
    { trackImage: 'assets/images/others/goes.png', name: 'So It Goes', tags: ['Hip-hop', 'Synthwave'] },
    { trackImage: 'assets/images/others/force.png', name: 'Force', tags: ['Country', 'Jazz'] },
    { trackImage: 'assets/images/others/sphera.png', name: 'Sphera', tags: ['Latin', 'R&B'] },
    { trackImage: 'assets/images/others/sundown.png', name: 'Sundown', tags: ['Indie Pop'] },
  ]

  backProfile() {
    this._navigationService.navigateToMyProfile();
  }
}
