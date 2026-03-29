
import { NgClass, NgOptimizedImage } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';

import { NavigationService } from '../../../../services/navigation.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'acrylic-header',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass,
    RouterLink
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {


    public _authService = inject(AuthService);

    public _navigationService = inject(NavigationService);
  
    ngOnInit(): void {
      if (this._authService.IsLoggedIn()) {
       console.log('Componente inicializado. Datos:');
      }
    }
  
    signOut(): void {
      this._authService.signOut();
    }

}
