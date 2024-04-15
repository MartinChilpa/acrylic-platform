import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';

@Component({
  selector: 'acrylic-auth',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuthComponent {
  constructor() {
    document.body.classList.remove('bg-primary');
    document.body.classList.add('bg-primary-gradient');
  }
}
