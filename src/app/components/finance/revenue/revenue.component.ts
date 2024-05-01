import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { CustomDropdownComponent } from '../../shared/custom-dropdown/custom-dropdown.component';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'acrylic-revenue',
  standalone: true,
  imports: [CustomDropdownComponent],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.scss'
})
export class RevenueComponent implements OnInit{
  @Input() form!: FormGroup;

  topUsedTrack = [
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' }
  ];
  topUseSynclists = [
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' },
    { name: 'Chill Vibes Café', price: '24,876' }
  ];

  ngOnInit(): void {
  }

  dropdownSelected($event: any) {
    this.form.get('name')?.setValue($event.name);
  }
}
