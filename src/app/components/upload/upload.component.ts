import { AfterViewInit, Component, ComponentRef, OnInit, ViewChild, ViewContainerRef, inject, ChangeDetectorRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MyArtistService } from '../../services/my-artist.service';
import { ModalService } from '../../services/modal.service';
import { ActivatedRoute } from '@angular/router';
import { IPrice } from '../../interfaces/response/price.response';

@Component({
  selector: 'acrylic-upload',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss',
})
export class UploadComponent implements OnInit, AfterViewInit {
  @ViewChild('acrylicUploadRef', { static: true, read: ViewContainerRef }) acrylicUploadRef!: ViewContainerRef;

  componentRefs!: ComponentRef<any>;
  activeStepper: number = 1;
  uploadStepperList = ['Connect split sheet', 'General Information', 'Preview & Confirm', 'Upload assets', 'Set your prices'];
  uploadTrackForm!: FormGroup;

  private _changeDetector: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);
  private _modalService = inject(ModalService);
  private _activatedRoute = inject(ActivatedRoute);
  uploadTrackId: string = ''
  isAssignPrice: boolean = false

  ngOnInit(): void {
    this.uploadTrackId = this._activatedRoute.snapshot.params['trackId'];
    this.isAssignPrice = this._activatedRoute.snapshot.queryParams['p'];
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
      cover_image: [''],
      snippet: [''],
      file_wav: [''],
      file_mp3: [''],
      distributor: [''],
      tags: [],
      other_distributor_email: [''],
      other_distributor: [''],
      price: [],
      track_found: [0]
    }, { validator: this.otherEmailValidator });
    this.uploadTrackForm.get('isrc')?.disable()
    if (this.uploadTrackId) {
      this.getTrackById()
      if (this.isAssignPrice) {
        this.activeStepper = 5
      }
    }
  }

  otherEmailValidator(formGroup: FormGroup) {
    const distributor = formGroup.get('distributor');
    const otherEmail = formGroup.get('other_distributor_email');

    if (distributor?.value !== 'other') {
      otherEmail?.setErrors(null);
    } else {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      if (!emailPattern.test(otherEmail?.value)) {
        otherEmail?.setErrors({ invalidEmail: true });
      }
      else {
        otherEmail?.setErrors(null);
      }
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
          other_distributor: response.other_distributor,
          other_distributor_email: response.other_distributor_email,
          track_found: 0
        })
        if (this.componentRefs.instance.getSplitSheetDetail) {
          this.componentRefs.instance.getSplitSheetDetail();
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

  async loadComponent(step: number) {
    switch (step) {
      case 1:
        const { UploadStep1Component } = await import('./upload-step-1/upload-step-1.component');
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep1Component);
        break;
      case 2:
        const { UploadStep2Component } = await import('./upload-step-2/upload-step-2.component');
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep2Component);
        break;
      case 3:
        const { UploadStep4Component } = await import('./upload-step-4/upload-step-4.component');
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep4Component);
        break;
      case 4:
        const { UploadStep3Component } = await import('./upload-step-3/upload-step-3.component');
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep3Component);
        break;
      case 5:
        const { UploadStep5Component } = await import('./upload-step-5/upload-step-5.component');
        this.componentRefs = this.acrylicUploadRef.createComponent(UploadStep5Component);
        const stepInstance = this.componentRefs.instance;
        stepInstance.selectedPriceEvent.subscribe((price: IPrice) => {
          this.uploadTrackForm.get('price')?.setValue(price);
          this.publishTrack();
        });
        break;
      default:
        const { UploadStep1Component: DefaultComponent } = await import('./upload-step-1/upload-step-1.component');
        this.componentRefs = this.acrylicUploadRef.createComponent(DefaultComponent);
    }
    this.componentRefs.instance.form = this.uploadTrackForm;
    this.componentRefs.instance.nextStepper.subscribe((count: number) => {
      this.stepperCount(count);
    });
  }

  publishTrack() {
    const formData = new FormData();
    const fileKeys = ['cover_image', 'file_mp3', 'file_wav', 'snippet']
    const trackData = this.uploadTrackForm.value
    trackData.isrc = this.uploadTrackForm.get('isrc')?.value
    Object.keys(trackData).forEach(item => {
      const value = trackData[item]
      if (item == 'price' && value) {
        formData.append('price', value.uuid);
      }
      else if (!fileKeys.includes(item) && value) {
        formData.append(item, value);
      }
      else if (value && typeof value !== 'string') {
        formData.append(item, value);
      }
    });
    const uploadType = this.uploadTrackForm.value.id ? this._myArtistService.updateTracks(formData, this.uploadTrackForm.value.id) : this._myArtistService.createTracks(formData)
    uploadType.subscribe({
      next: response => {
        this._modalService.showModal('live-upload')
      }
    })
  }
}
