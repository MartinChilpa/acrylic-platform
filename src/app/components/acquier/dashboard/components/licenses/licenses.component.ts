import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../../../../services/projects.service';
import { TeamBrandingService } from '../../../../../services/team-branding.service';

interface LicenseEntry {
  track: any;
  licensedAt: Date;
  licenseId: string;
  licenseType: string;
  whitelistingStatus: 'confirmed' | 'requested' | 'needs-attention' | 'pending';
  project: string;
  usageDue: string | null;
  teamName: string;
}

@Component({
  selector: 'acrylic-licenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './licenses.component.html',
  styleUrl: './licenses.component.scss',
})
export class LicensesComponent implements OnInit {
  private projectsService = inject(ProjectsService);
  private brandingService = inject(TeamBrandingService);

  licenses: LicenseEntry[] = [];
  selectedLicense: LicenseEntry | null = null;
  searchQuery = '';

  get filteredLicenses(): LicenseEntry[] {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.licenses;
    return this.licenses.filter(l =>
      (l.track.track_name ?? '').toLowerCase().includes(q) ||
      (l.track.artist_canonical ?? l.track.artist_name ?? '').toLowerCase().includes(q) ||
      l.licenseId.toLowerCase().includes(q) ||
      (l.track.isrc ?? '').toLowerCase().includes(q)
    );
  }

  get activeLicensesCount(): number { return this.licenses.length; }
  get whitelistingInProgressCount(): number { return this.licenses.filter(l => l.whitelistingStatus === 'requested').length; }
  get needsAttentionCount(): number { return this.licenses.filter(l => l.whitelistingStatus === 'needs-attention').length; }

  ngOnInit(): void {
    this.projectsService.licensedTracks$.subscribe((tracks) => {
      const teamName = this.brandingService.getActiveBranding().teamName;
      this.licenses = tracks.map((track, i) => this.buildEntry(track, i, teamName));
      if (this.selectedLicense) {
        const stillExists = this.licenses.find(l => l.licenseId === this.selectedLicense!.licenseId);
        if (!stillExists) { this.selectedLicense = null; }
      }
    });
    // Hydrate from backend on mount (merges with any in-memory optimistic entries)
    this.projectsService.loadLicenses();
  }

  private buildEntry(track: any, index: number, teamName: string): LicenseEntry {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const num = String(index + 1).padStart(4, '0');
    return {
      track,
      licensedAt: now,
      licenseId: `ACR-${year}-${month}-${num}`,
      licenseType: track.tier_label ?? track.tier ?? 'ArtistPromo',
      whitelistingStatus: 'confirmed',
      project: '—',
      usageDue: null,
      teamName,
    };
  }

  selectLicense(license: LicenseEntry): void {
    this.selectedLicense = this.selectedLicense?.licenseId === license.licenseId ? null : license;
  }

  closePanelIfSame(license: LicenseEntry): void {
    if (this.selectedLicense?.licenseId === license.licenseId) {
      this.selectedLicense = null;
    }
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'confirmed': 'Confirmed',
      'requested': 'Requested',
      'needs-attention': 'Needs Attention',
      'pending': 'Pending',
    };
    return map[status] ?? status;
  }

  getTierClass(type: string): string {
    const t = (type ?? '').toLowerCase();
    if (t.includes('bid')) return 'badge--bid2clear';
    if (t.includes('pre')) return 'badge--preclear';
    return 'badge--artist';
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  formatDuration(track: any): string {
    const d = track?.duration ?? track?.duration_seconds;
    if (!d) return '—';
    const mins = Math.floor(d / 60);
    const secs = Math.floor(d % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  getTrackImage(track: any): string {
    return track?.cover_image ?? track?.image_url ?? 'assets/images/others/default.jpg';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/others/default.jpg';
  }
}
