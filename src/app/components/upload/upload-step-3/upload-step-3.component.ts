import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormGroup } from '@angular/forms';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'acrylic-upload-step-3',
  standalone: true,
  imports: [FileDropzoneComponent],
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

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
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
    if (key == 'file_wav') {
      this.form.get('file_mp3')?.setValue($event[0])
    }
  }
}
