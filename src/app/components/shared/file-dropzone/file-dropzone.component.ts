import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FileDragDropDirective } from '../../../directives/file-drag-drop.directive';
import { AlertService } from '../../../services/alert.service';
import { ExtractFileNameDirective } from '../../../directives/extract-file-name.directive';

@Component({
  selector: 'acrylic-file-dropzone',
  standalone: true,
  imports: [
    NgOptimizedImage,
    FileDragDropDirective,
    NgClass,
    ExtractFileNameDirective
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
  @Input() allowExtensions: string[] = [];
  @Input() required: boolean = true;
  @Input() accept: string = '';
  @Output() uploadedFileList = new EventEmitter<File[]>();

  private _alertService = inject(AlertService);

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
    let canUpload = true;
    if (this.allowExtensions && this.allowExtensions.length > 0) {
      files.forEach(item => {
        const extension = item.name.split('.')[item.name.split('.').length - 1]
        if (this.allowExtensions.every(x => x.toLowerCase() != extension.toLowerCase())) {
          canUpload = false;
          this._alertService.error(`Allowed file extensions are ${this.allowExtensions.join(', ')} only.`)
          return;
        }
      })
    }
    if (canUpload) {
      this.uploadedFiles = [files[0]].filter(x => x)
      this.uploadedFileList.emit(this.uploadedFiles);
    }
  }

  removeUpload(index: number) {
    const uploadIndex = this.uploadedFiles.findIndex((_, i) => i == index);
    if (uploadIndex >= 0) {
      this.uploadedFiles.splice(uploadIndex, 1)
      this.uploadedFileList.emit(this.uploadedFiles);
    }
  }
}
