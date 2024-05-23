import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';
import { MyArtistService } from '../../../services/my-artist.service';

@Component({
  selector: 'acrylic-upload-step-3',
  standalone: true,
  imports: [FileDropzoneComponent, ReactiveFormsModule],
  templateUrl: './upload-step-3.component.html',
  styleUrl: './upload-step-3.component.scss'
})
export class UploadStep3Component {

  @ViewChild("snippetComponent") snippetComponent!: FileDropzoneComponent

  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();
  private _alertService = inject(AlertService);
  UploadFileTextDetails = [
    { fileDropzoneIcon: '/assets/images/icons/file-audio.svg', fileDropzoneHeader: 'Drop your Track Wav file here or upload it manually', fileDropzoneSize: '', fileDropzoneExternalLink: '' },
    { fileDropzoneIcon: '/assets/images/icons/drop.svg', fileDropzoneHeader: 'Drop your Cover Art File here or upload it manually', fileDropzoneSize: 'JPG 3000px x 3000px', fileDropzoneExternalLink: '' },
    { fileDropzoneIcon: '/assets/images/icons/file.svg', fileDropzoneHeader: 'Drop your snippets here or upload them manually', fileDropzoneSize: '', fileDropzoneExternalLink: '' },
  ]

  private _myArtistService = inject(MyArtistService)

  nextUploadStepper(count: number) {
    // this.addUpdateTracks(count);
    this.nextStepper.emit(count);
  }

  addUpdateTracks(count: number) {
    const data = this.form.value
    if (data.other_distributor) {
      data.distributor = ''
    } else {
      data.other_distributor = ''
      data.other_distributor_email = ''
    }
    data.isrc = this.form.get('isrc')?.value
    const formData = new FormData();
    const fileKeys = ['cover_image', 'file_mp3', 'file_wav', 'snippet']
    Object.keys(data).forEach(item => {
      const value = data[item]
      if (item == 'price') {
        if (value) {
          formData.append('price', value.uuid);
        }
      }
      else if (!fileKeys.includes(item)) {
        formData.append(item, value);
      }
      else if (value && typeof value !== 'string') {
        formData.append(item, value);
      }
    })
    const uploadType = this.form.value.id ? this._myArtistService.updateTracks(formData, this.form.value.id) : this._myArtistService.createTracks(formData)
    uploadType.subscribe({
      next: response => {
        this.form.patchValue({
          id: response.uuid,
          cover_image: response.cover_image,
          snippet: response.snippet,
          file_wav: response.file_wav,
          file_mp3: response.file_mp3,
          tags: response.tags
        })
        this.nextStepper.emit(count);
      }
    })
  }

  setUploadFile(key: string, $event: File[]) {
    if (key == 'snippet') {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        if (audio.duration > 30) {
          this._alertService.error("Snippet can't be long than 30 seconds");
          this.form.get('snippet')?.setValue(null)
          this.snippetComponent.uploadedFiles = []
        }
      };
      audio.src = URL.createObjectURL($event[0]);
    }
    this.form.get(key)?.setValue($event[0])
    // if (key == 'file_wav') {
    //   this.form.get('file_mp3')?.setValue($event[0])
    // }
  }
}
