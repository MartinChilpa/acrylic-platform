import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, ComponentRef, OnInit, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';
import { ActivatedRoute } from '@angular/router';
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

  @ViewChild('acrylicSynclistRef', { static: true, read: ViewContainerRef }) acrylicSynclistRef!: ViewContainerRef;

  componentRefs!: ComponentRef<any>;

  activeStepper: number = 1;
  synclistForm!: FormGroup;
  isLoading: boolean = true
  private _navigationService = inject(NavigationService);
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);
  private _activatedRoute = inject(ActivatedRoute);

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
    this.loadComponent(this.activeStepper)
    if (this.synclistId) {
      this.getSynclist();
    } else {
      this.isLoading = false
      this.componentRefs.instance.isLoading = this.isLoading;
    }
  }

  backProfile() {
    if (this.activeStepper == 1) {
      this._navigationService.navigateToMyProfile();
    } else {
      this.activeStepper = 1;
      this.loadComponent(this.activeStepper);
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
    this.loadComponent(this.activeStepper)
  }

  async loadComponent(step: number) {
    this.acrylicSynclistRef.clear();
    switch (step) {
      case 1:
        const { CreateSynclistComponent } = await import('./../create-synclist/create-synclist.component');
        this.componentRefs = this.acrylicSynclistRef.createComponent(CreateSynclistComponent);
        this.componentRefs.instance.isLoading = this.isLoading;
        this.componentRefs.instance.synclistForm = this.synclistForm;
        break;
      case 2:
        const { AddTrackComponent } = await import('./../add-track/add-track.component');
        this.componentRefs = this.acrylicSynclistRef.createComponent(AddTrackComponent);
        this.componentRefs.instance.synclistId = this.synclistId;
        this.componentRefs.instance.synclistTracks = this.synclistTracks;
        break;
      default:
        const { CreateSynclistComponent: DefaultComponent } = await import('./../create-synclist/create-synclist.component');
        this.componentRefs = this.acrylicSynclistRef.createComponent(DefaultComponent);
        this.componentRefs.instance.isLoading = this.isLoading;
        this.componentRefs.instance.synclistForm = this.synclistForm;
    }
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
        this.componentRefs.instance.isLoading = this.isLoading;
        this.componentRefs.instance.synclistTracks = this.synclistTracks;
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
        this.componentRefs.instance.synclistId = this.synclistId;
        this.activeStepper = 2;
        this.loadComponent(this.activeStepper);
      }
    })
  }

  publish() {
    if (this.activeStepper == 1) {
      this.saveSynclist();
    }
    else {
      this._navigationService.navigateToMyProfile();
    }
  }
}
