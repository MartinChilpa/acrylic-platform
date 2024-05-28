import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileDropzoneComponent } from '../../shared/file-dropzone/file-dropzone.component';

@Component({
  selector: 'acrylic-create-synclist',
  standalone: true,
  imports: [ReactiveFormsModule, FileDropzoneComponent],
  templateUrl: './create-synclist.component.html',
  styleUrl: './create-synclist.component.scss'
})
export class CreateSynclistComponent {
  fileDropzoneIcon = '/assets/images/icons/drop.svg'
  fileDropzoneHeader = 'Drop your Cover Art File here or upload it manually';
  fileDropzoneSize = 'JPG 1920px x 1080px';
  
  @Input() synclistForm!: FormGroup;
  @Input() isLoading: boolean = true

  setUploadFile(key: string, $event: File[]) {
    this.synclistForm.get(key)?.setValue($event[0])
  }
}
