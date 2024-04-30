import { Directive, ElementRef, Input, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[acrylicHighLight]',
  standalone: true
})
export class HighLightDirective {
  @Input() searchedWord!: string;
  @Input() content!: any;
  @Input() classToApply!: string;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.content || !this.searchedWord || !this.searchedWord.length || !this.classToApply) {
      return;
    }

    this.renderer.setProperty(
      this.el.nativeElement,
      'innerHTML',
      this.getFormattedText()
    );
  }

  getFormattedText() {
    const re = new RegExp(`(${this.searchedWord})`, 'gi');
    return this.content.name.replace(re, `<span class="${this.classToApply}">$1</span>`) + (this.content.text ? `<span class="bg-light-gray px-2 py-1 radius-5 ms-auto">${this.content.text}</span>` : '');
  }

}
