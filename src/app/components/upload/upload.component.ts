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

  ngOnInit(): void {
    this.uploadTrackForm = this._fb.group({
      id: [null],
      isrc: ['GBQS21200010', [Validators.required, Validators.pattern(/^[A-Z]{4}\d{8}$/)]],
      name: ['', Validators.required],
      duration: [2],
      released: ['2024-04-29'],
      is_cover: [false],
      is_remix: [false],
      is_instrumental: [false],
      is_explicit: [false],
      bpm: [1],
      lyrics: [null],
      cover_image: [null],
      snippet: [null],
      file_wav: [null],
      file_mp3: [null],
      distributor: [null],
      tags: [],
    });
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
    Object.keys(this.uploadTrackForm.value).forEach(item => {
      formData.append(item, this.uploadTrackForm.value[item]);
    })
    this._myArtistService.updateTracks(formData, this.uploadTrackForm.value.id).subscribe({
      next: response => {
        this._modalService.showModal('live-upload')
      }
    })
  }
}
