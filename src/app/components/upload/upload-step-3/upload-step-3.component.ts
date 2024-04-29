import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormGroup } from '@angular/forms';
import { MyArtistService } from '../../../services/my-artist.service';

@Component({
  selector: 'acrylic-upload-step-3',
  standalone: true,
  imports: [FileDropzoneComponent],
  templateUrl: './upload-step-3.component.html',
  styleUrl: './upload-step-3.component.scss'
})
export class UploadStep3Component {
  @Input() form!: FormGroup;
  @Output() nextStepper = new EventEmitter();
  UploadFileTextDetails = [
    { fileDropzoneIcon: '/assets/images/icons/file-audio.svg', fileDropzoneHeader: 'Drop your Track Wav file here or upload it manually', fileDropzoneSize: '', fileDropzoneExternalLink: '' },
    { fileDropzoneIcon: '/assets/images/icons/drop.svg', fileDropzoneHeader: 'Drop your Cover Art File here or upload it manually', fileDropzoneSize: 'JPG 3000px x 3000px', fileDropzoneExternalLink: '' },
    { fileDropzoneIcon: '/assets/images/icons/file.svg', fileDropzoneHeader: 'Drop your snippets here or upload them manually', fileDropzoneSize: '', fileDropzoneExternalLink: '' },
  ]

  private _myArtistService = inject(MyArtistService);

  nextUploadStepper(count: number) {
    if (count == 4) {
      this.publishTrack(count)
    } else {
      this.nextStepper.emit(count);
    }
  }

  publishTrack(count: number) {
    const formData = new FormData();
    Object.keys(this.form.value).forEach(item => {
      formData.append(item, this.form.value[item]);
    })
    this._myArtistService.createTracks(formData).subscribe({
      next: response => {
        this.form.get('id')?.setValue(response.uuid)
        this.form.get('tags')?.setValue(response.tags)
        this.nextStepper.emit(count);
      }
    })
  }

  setUploadFile(key: string, $event: File[]) {
    this.form.get(key)?.setValue($event[0])
    if (key == 'file_wav') {
      this.form.get('file_mp3')?.setValue($event[0])
    }
  }
}
