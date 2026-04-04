import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'acrylic-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {
  @Input() teamName: string = '';
  @Input() teamLogo: string = '';
  @Input() tagline: string = '';
  @Input() primaryColor: string = '#003DA6';
  @Input() secondaryColor: string = '#FFFFFF';

  get dynamicStyles() {
    return {
      '--primary-color': this.primaryColor,
      '--secondary-color': this.secondaryColor,
    };
  }
}
