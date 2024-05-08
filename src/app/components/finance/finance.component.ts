import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'acrylic-finance',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FinanceComponent {

}
