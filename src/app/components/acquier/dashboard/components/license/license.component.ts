import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
@Component({
  selector: 'acrylic-license',
  standalone: true,
   imports: [NgClass],

  templateUrl: './license.component.html',
  styleUrl: './license.component.scss'
})
export class LicenseComponent {
  @Input() priceId: number | string | null | undefined;
  @Input() trackPrice: number | string | null | undefined;
  @Output() licenseClick = new EventEmitter<void>();

  get theme(): 'preclear' | 'artistpromo' | 'bid2clear' {
    const id = Number(this.priceId);
    if (id === 1) return 'artistpromo';
    if (id === 3) return 'bid2clear';
    return 'artistpromo';
  }

  get displayPrice(): string {
    const raw = Number(this.trackPrice);
    if (Number.isFinite(raw) && raw > 0) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(raw);
    }
    return '$0.00';
  }

  get headline(): string {
    return this.theme === 'artistpromo' ? 'Included' : this.displayPrice;
  }

  get subheadline(): string {
    if (this.theme === 'artistpromo') return 'Artist promo License';
    if (this.theme === 'bid2clear') return 'Bid2Clear Price';
    return 'Artist promo License';
  }

  get ctaLabel(): string {
    return this.theme === 'artistpromo' ? 'License' : `License for ${this.displayPrice}`;
  }

}
