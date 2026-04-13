import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'acrylic-auth-club-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './auth-club-layout.component.html',
  styleUrl: './auth-club-layout.component.scss'
})
export class AuthClubLayoutComponent {
    constructor() {
    document.body.classList.remove('bg-primary');
    document.body.classList.add('bg-primary-gradient-montreal');
  }

}
