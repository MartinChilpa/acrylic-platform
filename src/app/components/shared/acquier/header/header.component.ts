import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'acrylic-header',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Input() teamName: string = '';
  @Input() teamLogo: string = '';
  @Input() tagline: string = '';
  @Input() primaryColor: string = '#AD46FF';
  @Input() secondaryColor: string = '#FFFFFF';
  /** hero: the large club banner (Home). compact: the workspace bar used on inner tabs. */
  @Input() variant: 'hero' | 'compact' = 'hero';
  /** Compact only: the current tab and its one-line description, shown on the right. */
  @Input() pageTitle: string = '';
  @Input() pageDescription: string = '';

  get dynamicStyles() {
    return {
      '--primary-color': this.primaryColor,
      '--secondary-color': this.secondaryColor,
    };
  }
}
