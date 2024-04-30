import { NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'acrylic-add-synclist',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FileDropzoneComponent,
    ReactiveFormsModule
  ],
  templateUrl: './manage-synclist.component.html',
  styleUrl: './manage-synclist.component.scss'
})
export class ManageSynclistComponent implements OnInit {
  fileDropzoneIcon = '/assets/images/icons/drop.svg'
  fileDropzoneHeader = 'Drop your Cover Art File here or upload it manually';
  fileDropzoneSize = 'JPG 1920px x 1080px';
  synclistForm!: FormGroup;
  private _navigationService = inject(NavigationService);
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);
  private _activatedRoute = inject(ActivatedRoute);

  trackSyncList = [
    { trackImage: 'assets/images/others/falling.png', name: 'Falling', tags: ['Lo-Fi', 'Pop'] },
    { trackImage: 'assets/images/others/goes.png', name: 'So It Goes', tags: ['Hip-hop', 'Synthwave'] },
    { trackImage: 'assets/images/others/force.png', name: 'Force', tags: ['Country', 'Jazz'] },
    { trackImage: 'assets/images/others/sphera.png', name: 'Sphera', tags: ['Latin', 'R&B'] },
    { trackImage: 'assets/images/others/sundown.png', name: 'Sundown', tags: ['Indie Pop'] },
  ]
  synclistId: string = ''

  ngOnInit(): void {
    this.synclistId = this._activatedRoute.snapshot.params['synclistId'];
    this.synclistForm = this._fb.group({
      id: [null],
      name: [null],
      cover_image: [null],
      background_image: [null],
      description: [''],
      pinned: [true],
    })
    if (this.synclistId) {
      this.getSynclist();
    }
  }

  backProfile() {
    this._navigationService.navigateToMyProfile();
  }

  setUploadFile(key: string, $event: File[]) {
    this.synclistForm.get(key)?.setValue($event[0])
  }

  getSynclist() {
    this._myArtistService.getSynclistById(this.synclistId).subscribe({
      next: response => {
        this.synclistForm.patchValue({
          id: response.uuid,
          name: response.name,
          cover_image: response.cover_image,
          background_image: response.background_image,
          description: response.description,
          pinned: response.pinned
        })
      }
    })
  }

  saveSynclist() {
    const formData = new FormData();
    Object.keys(this.synclistForm.value).forEach(item => {
      formData.append(item, this.synclistForm.value[item]);
    })
    const synclistType = !this.synclistForm.value.id ? this._myArtistService.createSynclist(formData) : this._myArtistService.updateSynclist(formData, this.synclistForm.value.id)
    synclistType.subscribe({
      next: response => {
        this.backProfile();
      }
    })
  }
}
