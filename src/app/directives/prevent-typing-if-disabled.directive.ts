import { Directive, ElementRef, HostListener, Input, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[acrylicPreventTypingIfDisabled]',
  standalone: true
})
export class PreventTypingIfDisabledDirective {

  private el = inject(ElementRef)
  private renderer = inject(Renderer2)

  constructor() { }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
    event.preventDefault();
  }

  @HostListener('paste', ['$event']) onPaste(event: ClipboardEvent) {
    event.preventDefault();
  }

  ngOnChanges() {
    this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
  }

}
