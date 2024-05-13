import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[acrylicFileDownload]',
  standalone: true
})
export class FileDownloadDirective {
  @Input('appFileDownload') fileUrl!: string;

  @HostListener('click', ['$event'])
  downloadFile(event: MouseEvent) {
    event.preventDefault();
    if (!this.fileUrl) {
      return;
    }
    
    const link = document.createElement('a');
    link.setAttribute('href', this.fileUrl);
    link.setAttribute('download', this.fileUrl);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
  }
}
