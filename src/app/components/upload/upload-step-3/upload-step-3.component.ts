import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';
import { FormGroup } from '@angular/forms';

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

  nextUploadStepper(count: number) {
    this.nextStepper.emit(count);
  }

  setUploadFile(key: string, $event: File[]) {
    this.form.get(key)?.setValue($event[0])
    if (key == 'file_wav') {
      this.form.get('file_mp3')?.setValue($event[0])
    }
  }
}
