import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ProjectsService } from '../../../../../services/projects.service';

export interface PlatformOption {
  key: string;
  label: string;
  icon: string;
  url?: string;
}

@Component({
  selector: 'acrylic-license-platform-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './license-platform-modal.component.html',
  styleUrl: './license-platform-modal.component.scss'
})
export class LicensePlatformModalComponent implements OnInit {
  private projectsService = inject(ProjectsService);
  private transloco = inject(TranslocoService);

  @Input() trackUuid: string = '';
  @Input() trackName: string = '';
  @Input() trackArtist: string = '';
  @Input() coverImage: string = '';
  @Input() trackData: any = {};
  @Input() clubPlatforms: { instagram?: string; tiktok?: string; youtube?: string; other?: string } = {};
  @Input() extendedCommercialUse: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ selected_platforms: string[]; other_url?: string }>();
  @Output() success = new EventEmitter<any>();

  isLoading: boolean = false;

  platformOptions: PlatformOption[] = [];
  selectedPlatforms: Set<string> = new Set();
  otherUrl: string = '';
  showOtherInput: boolean = false;

  ngOnInit() {
    this.initializePlatforms();
  }

  private initializePlatforms() {
    this.platformOptions = [
      { key: 'instagram', label: this.transloco.translate('licensePlatformModal.instagram'), icon: '📱', url: this.clubPlatforms['instagram'] },
      { key: 'tiktok', label: this.transloco.translate('licensePlatformModal.tiktok'), icon: '♪', url: this.clubPlatforms['tiktok'] },
      { key: 'youtube', label: this.transloco.translate('licensePlatformModal.youtube'), icon: '▶', url: this.clubPlatforms['youtube'] },
      { key: 'other', label: this.transloco.translate('licensePlatformModal.otherPlatform'), icon: '🔗', url: this.clubPlatforms['other'] }
    ];
  }

  get availablePlatforms(): PlatformOption[] {
    return this.platformOptions.filter(p => p.url || p.key === 'other');
  }

  togglePlatform(key: string) {
    if (key === 'other') {
      this.showOtherInput = !this.showOtherInput;
      if (!this.showOtherInput) {
        this.selectedPlatforms.delete('other');
        this.otherUrl = '';
      } else {
        this.selectedPlatforms.add('other');
      }
    } else {
      if (this.selectedPlatforms.has(key)) {
        this.selectedPlatforms.delete(key);
      } else {
        this.selectedPlatforms.add(key);
      }
    }
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedPlatforms.clear();
      this.showOtherInput = false;
      this.otherUrl = '';
    } else {
      this.availablePlatforms.forEach(p => this.selectedPlatforms.add(p.key));
      if (this.availablePlatforms.some(p => p.key === 'other')) {
        this.showOtherInput = true;
      }
    }
  }

  get allSelected(): boolean {
    const availableKeys = this.availablePlatforms.map(p => p.key);
    return availableKeys.every(key => this.selectedPlatforms.has(key));
  }

  get isValid(): boolean {
    if (this.selectedPlatforms.size === 0) return false;
    if (this.selectedPlatforms.has('other') && !this.otherUrl.trim()) return false;
    return true;
  }

  isPlatformSelected(key: string): boolean {
    return this.selectedPlatforms.has(key);
  }

  onSubmit() {
    if (!this.isValid || !this.trackUuid) return;

    this.isLoading = true;
    const platforms = Array.from(this.selectedPlatforms);

    this.projectsService.createLicense(this.trackUuid, platforms, this.extendedCommercialUse).subscribe({
      next: (license) => {
        // Optimistically add to list immediately
        this.projectsService.addLicensedTrack(license);
        this.success.emit(license);
        this.isLoading = false;
        this.onClose();
      },
      error: (err) => {
        console.error('License creation failed', err);
        this.isLoading = false;
      }
    });
  }

  onClose() {
    this.close.emit();
  }
}
