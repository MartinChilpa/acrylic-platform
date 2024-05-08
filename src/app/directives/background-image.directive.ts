import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[acrylicBackgroundImage]',
  standalone: true
})
export class BackgroundImageDirective {
  @Input() backgroundImage: string | undefined;
  constructor(private elementRef: ElementRef, private renderer: Renderer2) { }
  ngOnInit() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(this.elementRef.nativeElement);

    this.renderer.setStyle(
      this.elementRef.nativeElement,
      'backgroundImage',
      `url(${this.backgroundImage})`
    );
  }

  loadImage() {
    this.renderer.setStyle(
      this.elementRef.nativeElement,
      'backgroundImage',
      `url(${this.backgroundImage})`
    );
  }
}
