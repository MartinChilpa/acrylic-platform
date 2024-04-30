import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FileDragDropDirective } from '../../../directives/file-drag-drop.directive';

@Component({
  selector: 'acrylic-file-dropzone',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FileDragDropDirective,
    NgClass
  ],
  templateUrl: './file-dropzone.component.html',
  styleUrl: './file-dropzone.component.scss'
})
export class FileDropzoneComponent implements OnInit {
  @Input() fileDropzoneIcon!: string;
  @Input() fileDropzoneHeader!: string;
  @Input() fileDropzoneSize!: string;
  @Input() fileDropzoneExternalLink!: string;
  @Input() existingFiles!: any[];
  @Output() uploadedFileList = new EventEmitter<File[]>();

  @ViewChild("fileUpload") fileUpload!: ElementRef<HTMLElement>
  uploadedFiles: File[] = []

  droppedImageIcon = 'assets/images/icons/drop.svg';

  ngOnInit(): void {
    if (this.existingFiles && this.existingFiles?.length) {
      this.uploadedFiles = this.existingFiles.filter(file => file).map(file =>
        typeof file === 'string' ? <File>{
          name: file
        } : <File>file)
    }
  }

  dropzoneClicked($event: any) {
    if ($event?.target?.classList?.contains('ignore-upload')) {
      // Do not open the file selector, as Delete button is clicked
      return;
    }
    this.fileUpload.nativeElement.click()
  }

  onFileChange($event: any) {
    const files = <File[]>Array.from($event.files ? $event.files : $event)
    this.uploadedFiles = this.uploadedFiles.concat(files)
    this.uploadedFileList.emit(this.uploadedFiles);
  }

  removeUpload(index: number) {
    const uploadIndex = this.uploadedFiles.findIndex((_, i) => i == index);
    if (uploadIndex >= 0) {
      this.uploadedFiles.splice(uploadIndex, 1)
      this.uploadedFileList.emit(this.uploadedFiles);
    }
  }
}
