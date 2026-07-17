import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
@Component({
  selector: 'acrylic-license',
  standalone: true,
   imports: [NgClass, TranslocoModule],

  templateUrl: './license.component.html',
  styleUrl: './license.component.scss'
})
export class LicenseComponent {
  private transloco = inject(TranslocoService);

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
    return '$1,500';
  }

  get headline(): string {
    return this.theme === 'artistpromo' ? 'Included' : this.displayPrice;
  }

  get subheadline(): string {
    if (this.theme === 'artistpromo') return this.transloco.translate('license.artistPromoLicense');
    if (this.theme === 'bid2clear') return this.transloco.translate('license.bid2clearPrice');
    return this.transloco.translate('license.artistPromoLicense');
  }

  get ctaLabel(): string {
    if (this.theme === 'artistpromo') return this.transloco.translate('license.licenseCta');
    return this.transloco.translate('license.licenseForPrice', { price: this.displayPrice });
  }

}
