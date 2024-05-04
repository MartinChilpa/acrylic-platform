import { Component, OnInit, inject } from '@angular/core';
import { UploadStep1Component } from './upload-step-1/upload-step-1.component';
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
  imports: [NgClass, NgOptimizedImage, ReactiveFormsModule, UploadStep1Component, UploadStep2Component, UploadStep3Component, UploadStep4Component, UploadStep5Component],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent implements OnInit {
  activeStepper: number = 1;
  uploadStepperList = ['Connect split sheet', 'General Information', 'Upload assets', 'Preview & Confirm', 'Set your prices'];
  uploadTrackForm!: FormGroup;
  private _fb = inject(FormBuilder);
  private _myArtistService = inject(MyArtistService);
  private _modalService = inject(ModalService);
  private _activatedRoute = inject(ActivatedRoute);

  uploadTrackId: string = ''

  ngOnInit(): void {
    this.uploadTrackId = this._activatedRoute.snapshot.params['trackId'];
    this.uploadTrackForm = this._fb.group({
      id: [null],
      isrc: ['DDD333333333', [Validators.required, Validators.pattern(/^[A-Z]{2}-?\w{3}-?\d{2}-?\d{5}$/)]],
      name: ['', Validators.required],
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
      distributor: ['', Validators.required],
      tags: [],
    });
    if (this.uploadTrackId) {
      this.getTrackById()
    }
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
        })
      }
    })
  }

  uploadStepper(index: number) {
    if (this.activeStepper < index) {
      return;
    }
    this.activeStepper = index;
  }

  stepperCount(step: number) {
    this.activeStepper = step;
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
