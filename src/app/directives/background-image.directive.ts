import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[acrylicBackgroundImage]',
  standalone: true
})
export class BackgroundImageDirective {
  @Input() backgroundImage: string | undefined;
  constructor(private elementRef: ElementRef, private renderer: Renderer2) { }
  ngOnInit() {
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      'backgroundImage',
      `url(${this.backgroundImage})`
    );

    this.renderer.setStyle(
      this.elementRef.nativeElement,
      'backgroundSize',
      'cover'
    );

    this.renderer.setStyle(
      this.elementRef.nativeElement,
      'backgroundPosition',
      'center center'
    );
  }

}
