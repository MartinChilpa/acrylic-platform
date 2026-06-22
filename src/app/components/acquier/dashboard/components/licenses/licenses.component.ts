import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectsService } from '../../../../../services/projects.service';
import { LicenseService } from '../../../../../services/license.service';
import { TeamBrandingService } from '../../../../../services/team-branding.service';

type CampaignPlatform = 'youtube' | 'instagram' | 'tiktok';
type IconStatus = 'submitted' | 'overdue' | 'pending';

interface CampaignLink {
  url: string;
}

interface LicenseEntry {
  track: any;
  licensedAt: Date;
  licenseId: string;
  licenseType: string;
  whitelistingStatus: 'confirmed' | 'requested' | 'needs-attention' | 'pending';
  project: string;
  usageDue: string | null;
  isUsageOverdue: boolean;
  teamName: string;
  campaignLinks: Partial<Record<CampaignPlatform, CampaignLink>>;
}

interface CampaignPlatformMeta {
  key: CampaignPlatform;
  label: string;
  domains: string[];
}

@Component({
  selector: 'acrylic-licenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './licenses.component.html',
  styleUrl: './licenses.component.scss',
})
export class LicensesComponent implements OnInit, OnDestroy {
  private projectsService = inject(ProjectsService);
  private licenseService = inject(LicenseService);
  private brandingService = inject(TeamBrandingService);

  licenses: LicenseEntry[] = [];
  selectedLicense: LicenseEntry | null = null;
  searchQuery = '';

  /** Usage window: links are due within this many days of the licensed date. */
  private readonly usageWindowDays = 30;

  /** Inline "Add link" editor state (drawer). */
  editingPlatform: { licenseId: string; platform: CampaignPlatform } | null = null;
  linkInput = '';
  linkError = '';

  readonly campaignPlatforms: CampaignPlatformMeta[] = [
    { key: 'youtube', label: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
    { key: 'instagram', label: 'Instagram', domains: ['instagram.com'] },
    { key: 'tiktok', label: 'TikTok', domains: ['tiktok.com'] },
  ];

  private audioEls = new Map<string, HTMLAudioElement>();
  playingIds = new Set<string>();
  private trackTimes = new Map<string, { current: number; duration: number }>();

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
  get usageLinksDueCount(): number { return this.licenses.filter(l => !l.isUsageOverdue && this.getCampaignSubmittedCount(l) === 0).length; }
  get needsAttentionCount(): number { return this.licenses.filter(l => l.whitelistingStatus === 'needs-attention' || l.isUsageOverdue).length; }

  ngOnInit(): void {
    this.licenseService.licensedTracks$.subscribe((tracks) => {
      const teamName = this.brandingService.getActiveBranding().teamName;
      this.licenses = tracks.map((track, i) => this.buildEntry(track, i, teamName));
      if (this.selectedLicense) {
        const stillExists = this.licenses.find(l => l.licenseId === this.selectedLicense!.licenseId);
        this.selectedLicense = stillExists ?? null;
      }
    });
    // Hydrate from backend on mount (merges with any in-memory optimistic entries)
    this.licenseService.loadLicenses();
  }

  ngOnDestroy(): void {
    this.audioEls.forEach((audio) => audio.pause());
    this.audioEls.clear();
  }

  /**
   * Maps an in-memory licensed track to a row.
   *
   * TODO(backend): once `GET /my-club/licenses/` returns full ILicenseResult rows,
   * use the server values instead of these client-side placeholders:
   *   - licenseId            -> from backend (generated server-side)
   *   - licensedAt           -> ILicenseResult.created
   *   - whitelistingStatus   -> from backend ('confirmed' | 'requested' | 'needs-attention' | 'pending')
   *   - project / teamName    -> from backend (campaign/club association)
   *   - usageDue / overdue    -> derived from the backend usage-window dates
   *   - campaignLinks         -> from backend (see confirmAddLink/addCampaignLink TODO)
   */
  private buildEntry(track: any, index: number, teamName: string): LicenseEntry {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const num = String(index + 1).padStart(4, '0');
    const usage = this.computeUsageDue(now);
    return {
      track,
      licensedAt: now,
      licenseId: `ACR-${year}-${month}-${num}`,
      licenseType: track.tier_label ?? track.tier ?? 'ArtistPromo',
      whitelistingStatus: 'confirmed',
      project: '—',
      usageDue: usage.label,
      isUsageOverdue: usage.overdue,
      teamName,
      campaignLinks: {},
    };
  }

  /** 30-day countdown from the licensed date. */
  private computeUsageDue(licensedAt: Date): { label: string | null; overdue: boolean } {
    const msPerDay = 24 * 60 * 60 * 1000;
    const dueAt = licensedAt.getTime() + this.usageWindowDays * msPerDay;
    const daysLeft = Math.ceil((dueAt - Date.now()) / msPerDay);
    if (daysLeft <= 0) {
      return { label: null, overdue: true };
    }
    return { label: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`, overdue: false };
  }

  selectLicense(license: LicenseEntry): void {
    this.selectedLicense = this.selectedLicense?.licenseId === license.licenseId ? null : license;
  }

  deleteLicense(licenseUuid: string, event?: Event): void {
    event?.stopPropagation();
    if (!confirm('Are you sure you want to delete this license request?')) return;

    this.licenseService.deleteLicense(licenseUuid).subscribe({
      error: (err) => {
        console.error('Failed to delete license', err);
        alert('Failed to delete license. Please try again.');
      }
    });
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

  getPlayButtonClass(type: string): string {
    return 'play-btn--' + this.getTierClass(type).replace('badge--', '');
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  formatDuration(track: any): string {
    const d = track?.duration ?? track?.duration_seconds;
    if (!d) return '—';
    return this.formatMmSs(d);
  }

  private formatMmSs(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  getTrackImage(track: any): string {
    return track?.cover_image ?? track?.image_url ?? 'assets/images/others/default.jpg';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/others/default.jpg';
  }

  getArtistCountryCode2(track: any): string | null {
    const code2 = (track?.artist_country_code2 ?? '').toString().trim().toUpperCase();
    return code2.length === 2 ? code2 : null;
  }

  toFlagEmoji(code2: string | null): string {
    if (!code2 || code2.length !== 2) return '';
    const first = code2.charCodeAt(0);
    const second = code2.charCodeAt(1);
    const isAtoZ = (v: number) => v >= 65 && v <= 90;
    if (!isAtoZ(first) || !isAtoZ(second)) return '';
    const OFFSET = 0x1f1e6 - 65;
    return String.fromCodePoint(first + OFFSET, second + OFFSET);
  }

  /* ---------- Waveform / playback ---------- */

  private getTrackAudioUrl(track: any): string | null {
    const source = track?.file_wav ?? track?.audio_url;
    return typeof source === 'string' && source.length > 0 ? source : null;
  }

  canPlay(lic: LicenseEntry): boolean {
    return !!this.getTrackAudioUrl(lic.track);
  }

  isPlaying(lic: LicenseEntry): boolean {
    return this.playingIds.has(lic.licenseId);
  }

  togglePlay(lic: LicenseEntry, event?: Event): void {
    event?.stopPropagation();
    const url = this.getTrackAudioUrl(lic.track);
    if (!url) { return; }

    let audio = this.audioEls.get(lic.licenseId);
    if (!audio) {
      audio = new Audio(url);
      audio.addEventListener('timeupdate', () => {
        this.trackTimes.set(lic.licenseId, { current: audio!.currentTime, duration: audio!.duration || 0 });
      });
      audio.addEventListener('play', () => this.playingIds.add(lic.licenseId));
      audio.addEventListener('pause', () => this.playingIds.delete(lic.licenseId));
      audio.addEventListener('ended', () => this.playingIds.delete(lic.licenseId));
      this.audioEls.set(lic.licenseId, audio);
    }

    // Only one track plays at a time.
    this.audioEls.forEach((a, id) => { if (id !== lic.licenseId && !a.paused) { a.pause(); } });

    if (audio.paused) { audio.play(); } else { audio.pause(); }
  }

  getDurationLabel(lic: LicenseEntry): string {
    const t = this.trackTimes.get(lic.licenseId);
    if (this.isPlaying(lic) && t) { return this.formatMmSs(t.current); }
    return this.formatDuration(lic.track);
  }

  private getPlaybackProgress(lic: LicenseEntry): number {
    const t = this.trackTimes.get(lic.licenseId);
    if (t && t.duration) { return Math.min(1, t.current / t.duration); }
    return 0.35; // decorative resting position to match the design at idle
  }

  private hashString(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return Math.abs(h) || 1;
  }

  getWaveformBars(lic: LicenseEntry, count = 32): number[] {
    let seed = this.hashString(lic.licenseId);
    const bars: number[] = [];
    for (let i = 0; i < count; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      bars.push(4 + Math.round((seed / 233280) * 16)); // 4-20px
    }
    return bars;
  }

  isBarActive(lic: LicenseEntry, index: number, total: number): boolean {
    return index / total <= this.getPlaybackProgress(lic);
  }

  /* ---------- Campaign links ---------- */

  hasLink(lic: LicenseEntry, platform: CampaignPlatform): boolean {
    return !!lic.campaignLinks[platform]?.url;
  }

  getLinkValue(lic: LicenseEntry, platform: CampaignPlatform): string | null {
    return lic.campaignLinks[platform]?.url ?? null;
  }

  getCampaignSubmittedCount(lic: LicenseEntry): number {
    return this.campaignPlatforms.filter(p => this.hasLink(lic, p.key)).length;
  }

  getCampaignStatusLabel(lic: LicenseEntry): string {
    const count = this.getCampaignSubmittedCount(lic);
    return count > 0 ? `${count}+ submitted` : 'Pending';
  }

  getIconStatus(lic: LicenseEntry, platform: CampaignPlatform): IconStatus {
    // 'overdue' will be derivable once the backend exposes usage-link due dates.
    return this.hasLink(lic, platform) ? 'submitted' : 'pending';
  }

  onCampaignIconClick(lic: LicenseEntry, platform: CampaignPlatform): void {
    const url = this.getLinkValue(lic, platform);
    if (url) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    // Open the drawer so the link can be added with the inline editor.
    this.selectedLicense = lic;
  }

  isEditingLink(lic: LicenseEntry, platform: CampaignPlatform): boolean {
    return this.editingPlatform?.licenseId === lic.licenseId
      && this.editingPlatform?.platform === platform;
  }

  startAddLink(lic: LicenseEntry, platform: CampaignPlatform): void {
    this.editingPlatform = { licenseId: lic.licenseId, platform };
    this.linkInput = '';
    this.linkError = '';
  }

  cancelAddLink(): void {
    this.editingPlatform = null;
    this.linkInput = '';
    this.linkError = '';
  }

  confirmAddLink(lic: LicenseEntry, platform: CampaignPlatform): void {
    const meta = this.campaignPlatforms.find(p => p.key === platform);
    if (!meta) { return; }

    const url = this.linkInput.trim();
    if (!url) {
      this.linkError = 'Paste a link first.';
      return;
    }

    const isValidDomain = meta.domains.some((domain) => {
      try {
        const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        const host = new URL(normalized).hostname.toLowerCase();
        return host === domain || host.endsWith(`.${domain}`);
      } catch {
        return false;
      }
    });

    if (!isValidDomain) {
      this.linkError = `Enter a valid ${meta.domains[0]} URL.`;
      return;
    }

    lic.campaignLinks = { ...lic.campaignLinks, [platform]: { url } };
    this.editingPlatform = null;
    this.linkInput = '';
    this.linkError = '';
    // TODO(backend): persist campaign links once the usage-links endpoint is available.
  }

  /** Solid download button colored by license tier. */
  getDownloadButtonClass(type: string): string {
    return 'dl-btn--' + this.getTierClass(type).replace('badge--', '');
  }
}
