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

  @Input() track: any | null = null;
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

  getArchivalRestrictionText(): string {
    const value = this.getRestrictionValue(['archival', 'archival_restriction', 'archive_restriction']);
    return this.buildRestrictionBadgeText('Archival Restriction', value);
  }

  getYoutubeRestrictionText(): string {
    const value = this.getRestrictionValue(['youtube_restriction', 'youtubeRestriction']);
    return this.buildRestrictionBadgeText('YouTube Restriction', value);
  }

  private buildRestrictionBadgeText(label: string, value: string): string {
    const normalizedValue = this.normalizeRestrictionValue(value);
    if (!this.shouldShowRestrictionMonths(normalizedValue)) {
      return `${label}: ${normalizedValue}`;
    }
    return `${label}: ${normalizedValue} ${this.transloco.translate('licenses.restriction.month')}`;
  }

  private shouldShowRestrictionMonths(value: string): boolean {
    if (!value) return false;
    return !/none/i.test(value) && !/months?/i.test(value);
  }

  private normalizeRestrictionValue(value: string | null | undefined): string {
    const text = (value ?? '').toString().trim();
    if (!text) {
      return 'None';
    }
    const lower = text.toLowerCase();
    if (lower.includes('none')) {
      return 'None';
    }
    return text.replace(/\s+months?$/i, '').trim() || 'None';
  }

  private getRestrictionValue(keys: string[]): string {
    for (const key of keys) {
      const value = this.track?.[key];
      if (value === null || value === undefined || value === '') {
        continue;
      }
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'None';
      }
      const text = String(value).trim();
      return text || 'None';
    }
    return 'None';
  }

}
