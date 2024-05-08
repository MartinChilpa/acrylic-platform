import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[acrylicExtractFileName]',
  standalone: true
})
export class ExtractFileNameDirective implements OnInit {
  @Input('file-url') url: string = "";

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    const filename = this.getFilenameFromUrl(this.url);
    this.elementRef.nativeElement.innerText = filename;
  }

  private getFilenameFromUrl(url: string): string {
    const parts = url.split('/');
    const filenameWithParams = parts[parts.length - 1];
    const filename = filenameWithParams.split('?')[0];
    return filename;
  }
}
