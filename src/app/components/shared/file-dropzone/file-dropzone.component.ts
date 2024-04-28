import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
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
export class FileDropzoneComponent {

  @ViewChild("fileUpload") fileUpload!: ElementRef<HTMLElement>
  uploadedFiles: File[] = []

  droppedImageIcon = 'assets/images/icons/drop.svg';

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
  }

  removeUpload(index: number) {
    const uploadIndex = this.uploadedFiles.findIndex((_, i) => i == index);
    if (uploadIndex >= 0) {
      this.uploadedFiles.splice(uploadIndex, 1)
    }
  }
}
