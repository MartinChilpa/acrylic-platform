import { Component } from '@angular/core';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';

@Component({
  selector: 'acrylic-transactions',
  standalone: true,
  imports: [CustomDropdownComponent],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent {

}
