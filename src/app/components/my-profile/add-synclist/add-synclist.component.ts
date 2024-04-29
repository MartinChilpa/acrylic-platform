import { NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';

@Component({
  selector: 'acrylic-add-synclist',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FileDropzoneComponent,
    ReactiveFormsModule
  ],
  templateUrl: './add-synclist.component.html',
  styleUrl: './add-synclist.component.scss'
})
export class AddSynclistComponent implements OnInit {
  fileDropzoneIcon = '/assets/images/icons/drop.svg'
  fileDropzoneHeader = 'Drop your Cover Art File here or upload it manually';
  fileDropzoneSize = 'JPG 1920px x 1080px';
  synclistForm!: FormGroup;
  private _navigationService = inject(NavigationService);
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);

  trackSyncList = [
    { trackImage: 'assets/images/others/falling.png', name: 'Falling', tags: ['Lo-Fi', 'Pop'] },
    { trackImage: 'assets/images/others/goes.png', name: 'So It Goes', tags: ['Hip-hop', 'Synthwave'] },
    { trackImage: 'assets/images/others/force.png', name: 'Force', tags: ['Country', 'Jazz'] },
    { trackImage: 'assets/images/others/sphera.png', name: 'Sphera', tags: ['Latin', 'R&B'] },
    { trackImage: 'assets/images/others/sundown.png', name: 'Sundown', tags: ['Indie Pop'] },
  ]
  synclistId: string = ''

  ngOnInit(): void {
    this.synclistForm = this._fb.group({
      id: [null],
      name: [null],
      cover_image: [null],
      background_image: [null],
      description: [''],
      pinned: [true],
    })
  }

  backProfile() {
    this._navigationService.navigateToMyProfile();
  }

  setUploadFile(key: string, $event: File[]) {
    this.synclistForm.get(key)?.setValue($event[0])
  }

  saveSynclist() {
    const formData = new FormData();
    Object.keys(this.synclistForm.value).forEach(item => {
      formData.append(item, this.synclistForm.value[item]);
    })
    this._myArtistService.createSynclist(formData).subscribe({
      next: response => {
        this.backProfile();
      }
    })
  }
}
