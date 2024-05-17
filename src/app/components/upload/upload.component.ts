import { AfterViewInit, Component, ComponentRef, OnInit, ViewChild, ViewContainerRef, inject, ChangeDetectorRef } from '@angular/core';
import { UploadStep2Component } from './upload-step-2/upload-step-2.component';
import { UploadStep3Component } from './upload-step-3/upload-step-3.component';
import { UploadStep4Component } from './upload-step-4/upload-step-4.component';
import { UploadStep5Component } from './upload-step-5/upload-step-5.component';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MyArtistService } from '../../services/my-artist.service';
import { ModalService } from '../../services/modal.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'acrylic-upload',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, ReactiveFormsModule, UploadStep2Component, UploadStep3Component, UploadStep4Component, UploadStep5Component],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent implements OnInit, AfterViewInit {
  @ViewChild('acrylicUploadRef', { static: true, read: ViewContainerRef }) acrylicUploadRef!: ViewContainerRef;
  componentRefs!: ComponentRef<UploadStep2Component | UploadStep3Component | UploadStep4Component | UploadStep5Component >;
  activeStepper: number = 1;
  uploadStepperList = ['General Information', 'Upload assets', 'Preview & Confirm', 'Set your prices'];
  uploadTrackForm!: FormGroup;
  private _changeDetector: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);
  private _modalService = inject(ModalService);
  private _activatedRoute = inject(ActivatedRoute);

  uploadTrackId: string = ''

  ngOnInit(): void {
    this.uploadTrackId = this._activatedRoute.snapshot.params['trackId'];
    this.uploadTrackForm = this._fb.group({
      id: [null],
      isrc: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}-?\w{3}-?\d{2}-?\d{5}$/)]],
      name: [''],
      duration: [0],
      released: [new Date().toJSON().split('T')[0]],
      is_cover: [false],
      is_remix: [false],
      is_instrumental: [false],
      is_explicit: [false],
      bpm: [1],
      lyrics: [''],
      cover_image: ['', Validators.required],
      snippet: ['', Validators.required],
      file_wav: ['', Validators.required],
      file_mp3: [''],
      distributor: [''],
      tags: [],
      other_distributor: ['']
    });
    if (this.uploadTrackId) {
      this.getTrackById()
    }
  }

  ngAfterViewInit() {
    this.loadComponent(this.activeStepper);
    this._changeDetector.detectChanges();
  }

  getTrackById() {
    this._myArtistService.getTrackById(this.uploadTrackId).subscribe({
      next: response => {
        this.uploadTrackForm.patchValue({
          id: response.uuid,
          isrc: response.isrc,
          name: response.name,
          duration: response.duration,
          released: response.released,
          is_cover: response.is_cover,
          is_remix: response.is_remix,
          is_instrumental: response.is_instrumental,
          is_explicit: response.is_explicit,
          bpm: response.bpm,
          lyrics: response.lyrics,
          cover_image: response.cover_image,
          snippet: response.snippet,
          file_wav: response.file_wav,
          file_mp3: response.file_mp3,
          distributor: response.distributor,
          tags: response.tags,
          other_distributor: response.other_distributor
        })
        if (response.other_distributor) {
          this.uploadTrackForm.get('distributor')?.setValue('Other');
        }
      }
    })
  }

  uploadStepper(index: number) {
    if (this.activeStepper < index) {
      return;
    }
    this.acrylicUploadRef.clear();
    this.loadComponent(index);
    this.activeStepper = index;
  }

  stepperCount(step: number) {
    this.acrylicUploadRef.clear();
    this.loadComponent(step);
    this.activeStepper = step;
  }

  loadComponent(step: number) {
    switch (step) {
      // case 1:
      //   this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep1Component);
      //   break;
      case 1:
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep2Component);
        break;
      case 2:
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep3Component);
        break;
      case 3:
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep4Component);
        break;
      case 4:
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep5Component);
        const stepInstance = this.componentRefs.instance as UploadStep5Component;
        stepInstance.uploadAction.subscribe(() => {
          this.publishTrack();
        });
  
        break;
      default:
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep2Component);
    }
    this.componentRefs.instance.form = this.uploadTrackForm;
    this.componentRefs.instance.nextStepper.subscribe((count: number) => {
      this.stepperCount(count);
    });    
  }

  publishTrack() {
    const formData = new FormData();
    const fileKeys = ['cover_image', 'file_mp3', 'file_wav', 'snippet']
    Object.keys(this.uploadTrackForm.value).forEach(item => {
      const value = this.uploadTrackForm.value[item]
      if (!fileKeys.includes(item)) {
        formData.append(item, value);
      }
      else if (value && typeof value !== 'string') {
        formData.append(item, value);
      }
    })
    const uploadType = this.uploadTrackForm.value.id ? this._myArtistService.updateTracks(formData, this.uploadTrackForm.value.id) : this._myArtistService.createTracks(formData)
    uploadType.subscribe({
      next: response => {
        this._modalService.showModal('live-upload')
      }
    })
  }
}
