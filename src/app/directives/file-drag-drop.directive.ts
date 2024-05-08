import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[acrylicFileDragDrop]',
  standalone: true
})
export class FileDragDropDirective {

  @Output() private filesChangeEmiter: EventEmitter<File[]> = new EventEmitter();

  @HostListener('dragover', ['$event'])
  public onDragOver(evt: Event) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt: Event) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event'])
  public onDrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    let validFiles: Array<File> = evt.dataTransfer.files;
    this.filesChangeEmiter.emit(validFiles);
  }

}
