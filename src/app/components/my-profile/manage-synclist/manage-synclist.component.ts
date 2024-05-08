import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';
import { ActivatedRoute } from '@angular/router';
import { ICreateTracks } from '../../../interfaces/response/create-tracks.response';
import { TrackDetail } from '../../../interfaces/response/my-artist-synclist.response';

@Component({
  selector: 'acrylic-add-synclist',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FileDropzoneComponent,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './manage-synclist.component.html',
  styleUrl: './manage-synclist.component.scss'
})
export class ManageSynclistComponent implements OnInit {
  activeStepper: number = 1;
  fileDropzoneIcon = '/assets/images/icons/drop.svg'
  fileDropzoneHeader = 'Drop your Cover Art File here or upload it manually';
  fileDropzoneSize = 'JPG 1920px x 1080px';
  synclistForm!: FormGroup;
  isLoading: boolean = true
  private _navigationService = inject(NavigationService);
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);
  private _activatedRoute = inject(ActivatedRoute);
  trackList: ICreateTracks[] = []
  manageStepperList = ['Create Synclist', 'Add Tracks'];
  trackSyncList = [
    { trackImage: 'assets/images/others/falling.png', name: 'Falling', tags: ['Lo-Fi', 'Pop'] },
    { trackImage: 'assets/images/others/goes.png', name: 'So It Goes', tags: ['Hip-hop', 'Synthwave'] },
    { trackImage: 'assets/images/others/force.png', name: 'Force', tags: ['Country', 'Jazz'] },
    { trackImage: 'assets/images/others/sphera.png', name: 'Sphera', tags: ['Latin', 'R&B'] },
    { trackImage: 'assets/images/others/sundown.png', name: 'Sundown', tags: ['Indie Pop'] },
  ]
  synclistId: string = ''
  synclistTracks!: TrackDetail[]

  ngOnInit(): void {
    this.synclistId = this._activatedRoute.snapshot.params['synclistId'];
    this.synclistForm = this._fb.group({
      id: [null],
      name: [null, Validators.required],
      cover_image: [null, Validators.required],
      background_image: [null, Validators.required],
      description: ['', Validators.required],
      pinned: [true],
    })
    if (this.synclistId) {
      this.getSynclist();
    } else {
      this.isLoading = false
    }
    this.getTracks()
  }

  getTracks() {
    this._myArtistService.getTracks().subscribe({
      next: response => {
        this.trackList = response
      }
    })
  }

  backProfile() {
    if (this.activeStepper == 1) {
      this._navigationService.navigateToMyProfile();
    } else {
      this.activeStepper = 1;
    }
  }

  setUploadFile(key: string, $event: File[]) {
    this.synclistForm.get(key)?.setValue($event[0])
  }

  manageStepper(index: number) {
    if (!(this.synclistForm.valid && this.synclistId)) {
      if (this.activeStepper < index) {
        return;
      }
    }
    this.activeStepper = index;
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
        this.synclistTracks = response.tracks.map(x => x.track)
        this.isLoading = false
      }
    })
  }

  saveSynclist() {
    const formData = new FormData();
    const fileKeys = ['cover_image', 'background_image']
    Object.keys(this.synclistForm.value).forEach(item => {
      const value = this.synclistForm.value[item]
      if (!fileKeys.includes(item)) {
        formData.append(item, value);
      }
      else if (value && typeof value !== 'string') {
        formData.append(item, value);
      }
    })
    const synclistType = !this.synclistForm.value.id ? this._myArtistService.createSynclist(formData) : this._myArtistService.updateSynclist(formData, this.synclistForm.value.id)
    synclistType.subscribe({
      next: response => {
        this.synclistForm.get('id')?.setValue(response.uuid);
        this.synclistId = response.uuid;
        this.activeStepper = 2;
      }
    })
  }

  synclistChecked(trackId: string) {
    if (this.synclistTracks && Array.isArray(this.synclistTracks)) {
      return this.synclistTracks.some(x => x.uuid == trackId)
    }
    return false;
  }

  manageTags($event: any, trackId: string) {
    const tagManageType = $event.checked ? this._myArtistService.addSynclistTrack(this.synclistId, trackId) : this._myArtistService.removeSynclistTrack(this.synclistId, trackId)
    tagManageType.subscribe({
      next: response => {
        if ($event.checked) {
          this.synclistTracks.push({
            uuid: trackId
          } as any)
        } else {
          this.synclistTracks = this.synclistTracks.filter(x => x.uuid != trackId);
        }
      },
      error: () => {
        $event.checked = false;
      }
    });
  }
}
