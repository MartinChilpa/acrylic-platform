import { RouterLink } from '@angular/router';
import { Component, inject } from '@angular/core';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'acrylic-sign-up',
  standalone: true,
  imports: [
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  public _navigationService = inject(NavigationService);
}
