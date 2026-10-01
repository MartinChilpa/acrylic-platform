import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ProjectsService } from '../../../../../services/projects.service';
import { LicenseService } from '../../../../../services/license.service';
import { TeamBrandingService } from '../../../../../services/team-branding.service';
import { HeaderComponent } from '../../../../shared/acquier/header/header.component';
import { isPreClearTrack } from '../../../../../utils/license-tier.utils';

type CampaignPlatform = 'youtube' | 'instagram' | 'tiktok';
type LicenseFilter = 'all' | 'links' | 'expiring';
type AddLinkPhase = 'idle' | 'checking' | 'ready' | 'saving' | 'saved';
type AddLinkIssue = null | 'invalid' | 'duplicate' | 'unknown-platform' | 'restricted';
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
  imports: [CommonModule, FormsModule, TranslocoModule, HeaderComponent],
  templateUrl: './licenses.component.html',
  styleUrl: './licenses.component.scss',
})
export class LicensesComponent implements OnInit, OnDestroy {
  private projectsService = inject(ProjectsService);
  private licenseService = inject(LicenseService);
  private brandingService = inject(TeamBrandingService);
  private transloco = inject(TranslocoService);

  licenses: LicenseEntry[] = [];
  selectedLicense: LicenseEntry | null = null;
  searchQuery = '';

  /** Chips above the list. */
  activeFilter: LicenseFilter = 'all';

  /** Club branding for the page header, same source the dashboard uses. */
  private initialBranding = this.brandingService.getActiveBranding();
  teamName = this.initialBranding.teamName;
  teamLogo = this.initialBranding.teamLogo;
  tagline = this.initialBranding.tagline;
  primaryColor = this.initialBranding.primaryColor;
  secondaryColor = this.initialBranding.secondaryColor;

  /** Usage window: links are due within this many days of the licensed date. */
  private readonly usageWindowDays = 30;

  /** A license counts as expiring once it is this close to its archival date. */
  private readonly expiringSoonWindowDays = 30;

  /**
   * "Add a published link" panel. One paste box identifies the platform and
   * surfaces any license restriction before the link is recorded.
   */
  addLinkLicense: LicenseEntry | null = null;
  addLinkUrl = '';
  addLinkPlatformName = '';
  addLinkPhase: AddLinkPhase = 'idle';
  addLinkIssue: AddLinkIssue = null;
  detectedPlatform: string | null = null;
  savedLinkPlatform = '';
  savedLinkUrl = '';
  savedLinkRestricted = false;
  private detectTimerId: number | null = null;

  /**
   * Platforms this license does not clear. A link to one can still be recorded,
   * but it is flagged rather than approved.
   * TODO(backend): read the restriction list off the license instead.
   */
  private static readonly RESTRICTED_PLATFORMS = new Set(['Facebook']);

  /** Where whitelisting requests are sent. */
  private static readonly WHITELIST_INBOX = 'juan@acrylic.la';

  readonly campaignPlatforms: CampaignPlatformMeta[] = [
    { key: 'youtube', label: 'YouTube', domains: ['youtube.com', 'youtu.be'] },
    { key: 'instagram', label: 'Instagram', domains: ['instagram.com'] },
    { key: 'tiktok', label: 'TikTok', domains: ['tiktok.com'] },
  ];

  private audioEls = new Map<string, HTMLAudioElement>();
  playingIds = new Set<string>();
  private trackTimes = new Map<string, { current: number; duration: number }>();

  get filteredLicenses(): LicenseEntry[] {
    const byChip = this.licenses.filter(l => this.matchesFilter(l));
    const q = this.searchQuery.toLowerCase();
    if (!q) return byChip;
    return byChip.filter(l =>
      (l.track.track_name ?? '').toLowerCase().includes(q) ||
      (l.track.artist_canonical ?? l.track.artist_name ?? '').toLowerCase().includes(q) ||
      l.licenseId.toLowerCase().includes(q) ||
      (l.track.isrc ?? '').toLowerCase().includes(q)
    );
  }

  private matchesFilter(lic: LicenseEntry): boolean {
    if (this.activeFilter === 'links') { return this.needsLinks(lic); }
    if (this.activeFilter === 'expiring') { return this.isExpiringSoon(lic); }
    return true;
  }

  setFilter(filter: LicenseFilter): void {
    this.activeFilter = filter;
  }

  /** A license still waiting for the club to post its published links. */
  needsLinks(lic: LicenseEntry): boolean {
    return this.getCampaignSubmittedCount(lic) === 0;
  }

  isExpiringSoon(lic: LicenseEntry): boolean {
    const expiry = this.getLicenseExpiry(lic);
    if (!expiry) { return false; }
    const days = (expiry.getTime() - Date.now()) / 86_400_000;
    return days >= 0 && days <= this.expiringSoonWindowDays;
  }

  /**
   * How long the license runs is whatever the rightsholder set as the archival
   * window on the track (catalog_track.archival), counted from the licensed
   * date. No archival value means the license does not expire.
   */
  getLicenseExpiry(lic: LicenseEntry): Date | null {
    const months = this.readArchivalMonths(lic.track);
    if (months === null) { return null; }
    const expiry = new Date(lic.licensedAt);
    expiry.setMonth(expiry.getMonth() + months);
    return expiry;
  }

  /** Archival arrives as a month count, or a "None"/empty value for no limit. */
  private readArchivalMonths(track: any): number | null {
    for (const key of ['archival', 'archival_restriction', 'archive_restriction']) {
      const raw = track?.[key];
      if (raw === null || raw === undefined || raw === '') { continue; }
      const text = String(raw).trim();
      if (/none/i.test(text)) { return null; }
      const months = Number(text.replace(/\s*months?$/i, '').trim());
      if (Number.isFinite(months) && months > 0) { return months; }
    }
    return null;
  }

  get linksToAddCount(): number { return this.licenses.filter(l => this.needsLinks(l)).length; }
  get expiringSoonCount(): number { return this.licenses.filter(l => this.isExpiringSoon(l)).length; }

  get activeLicensesCount(): number { return this.licenses.length; }
  get whitelistingInProgressCount(): number { return this.licenses.filter(l => l.whitelistingStatus === 'requested').length; }
  get usageLinksDueCount(): number { return this.licenses.filter(l => !l.isUsageOverdue && this.getCampaignSubmittedCount(l) === 0).length; }
  get needsAttentionCount(): number { return this.licenses.filter(l => l.whitelistingStatus === 'needs-attention' || l.isUsageOverdue).length; }

  ngOnInit(): void {
    const branding = this.brandingService.getActiveBranding();
    this.teamName = branding.teamName;
    this.teamLogo = branding.teamLogo;
    this.tagline = branding.tagline;
    this.primaryColor = branding.primaryColor;
    this.secondaryColor = branding.secondaryColor;
    this.brandingService.applyCssVars(branding);

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
    this.clearDetectTimer();
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
   *   - licenseType           -> the tier (PreClear / ArtistPromo / Bid2Clear); until then
   *                              resolveLicenseType() falls back to LicenseService's
   *                              remembered tier, since ILicenseResult has no price fields
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
      licenseType: this.resolveLicenseType(track),
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
      'confirmed': 'licenses.status.confirmed',
      'requested': 'licenses.status.requested',
      'needs-attention': 'licenses.status.needsAttention',
      'pending': 'licenses.status.pending',
    };
    const key = map[status] ?? status;
    return this.transloco.translate(key);
  }

  /**
   * Tier for a license row, most trustworthy source first: a value the backend
   * sent, then the track's own price fields (optimistic rows still have them),
   * then what we recorded when the track was licensed.
   */
  private resolveLicenseType(track: any): string {
    if (track?.tier_label) return track.tier_label;
    if (track?.tier) return track.tier;
    if (isPreClearTrack(track)) return 'PreClear';
    return this.licenseService.getRememberedTier(track) ?? 'ArtistPromo';
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
    if (count > 0) {
      return `${count}+ ${this.transloco.translate('licenses.campaign.submitted')}`;
    }
    return this.transloco.translate('licenses.campaign.pending');
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

  /**
   * Whitelisting is requested by email for now: there is no endpoint for it.
   * The message is prefilled so the licensing team can act without a reply.
   * TODO(backend): POST the request once /my-club/licenses/<id>/whitelist/ exists.
   */
  getWhitelistMailto(lic: LicenseEntry): string {
    const track = lic.track?.track_name || lic.track?.name || '-';
    const artist = lic.track?.artist_canonical || lic.track?.artist_name || '-';
    const subject = `Whitelist request: ${track} - ${artist}`;
    const body = [
      'Please request whitelisting for the track below.',
      '',
      `Track: ${track}`,
      `Artist: ${artist}`,
      `ISRC: ${lic.track?.isrc || '-'}`,
      `License ID: ${lic.licenseId}`,
      `License type: ${lic.licenseType}`,
      `Club / Team: ${lic.teamName}`,
      `Date licensed: ${this.formatDate(lic.licensedAt)}`,
    ].join('\r\n');

    return `mailto:${LicensesComponent.WHITELIST_INBOX}`
      + `?subject=${encodeURIComponent(subject)}`
      + `&body=${encodeURIComponent(body)}`;
  }

  /* ─────────── Add a published link ─────────── */

  openAddLink(lic: LicenseEntry): void {
    this.addLinkLicense = lic;
    this.addLinkUrl = '';
    this.addLinkPlatformName = '';
    this.addLinkPhase = 'idle';
    this.addLinkIssue = null;
    this.detectedPlatform = null;
  }

  closeAddLink(): void {
    this.clearDetectTimer();
    this.addLinkLicense = null;
    this.addLinkUrl = '';
    this.addLinkPlatformName = '';
    this.addLinkPhase = 'idle';
    this.addLinkIssue = null;
    this.detectedPlatform = null;
  }

  /** Typing restarts identification; nothing is decided until it settles. */
  onAddLinkInput(): void {
    this.clearDetectTimer();
    this.addLinkIssue = null;
    this.detectedPlatform = null;

    const url = this.addLinkUrl.trim();
    if (!url) {
      this.addLinkPhase = 'idle';
      return;
    }

    this.addLinkPhase = 'checking';
    // TODO(backend): a real check would ask the API to identify the platform and
    // read the license restrictions. Until that endpoint exists this resolves
    // locally, with the short delay standing in for the round trip.
    this.detectTimerId = window.setTimeout(() => this.resolveAddLink(), 400);
  }

  private resolveAddLink(): void {
    const url = this.addLinkUrl.trim();
    const host = this.readHost(url);

    if (!host) {
      this.addLinkPhase = 'idle';
      this.addLinkIssue = 'invalid';
      return;
    }

    if (this.addLinkLicense && this.isDuplicateLink(this.addLinkLicense, url)) {
      this.addLinkPhase = 'idle';
      this.addLinkIssue = 'duplicate';
      return;
    }

    this.detectedPlatform = this.identifyPlatform(host, url);
    this.addLinkPhase = 'ready';

    if (!this.detectedPlatform) {
      this.addLinkIssue = 'unknown-platform';
      return;
    }
    if (LicensesComponent.RESTRICTED_PLATFORMS.has(this.detectedPlatform)) {
      this.addLinkIssue = 'restricted';
    }
  }

  /** Only an absolute http(s) link to a post counts. */
  private readHost(url: string): string | null {
    if (!/^https?:\/\//i.test(url)) { return null; }
    try {
      const parsed = new URL(url);
      return parsed.pathname && parsed.pathname !== '/' ? parsed.hostname.toLowerCase() : null;
    } catch {
      return null;
    }
  }

  private identifyPlatform(host: string, url: string): string | null {
    if (host.includes('youtube.com') || host === 'youtu.be') {
      return url.includes('/shorts/') ? 'YouTube Shorts' : 'YouTube';
    }
    if (host.includes('instagram.com')) { return 'Instagram'; }
    if (host.includes('tiktok.com')) { return 'TikTok'; }
    if (host.includes('facebook.com') || host === 'fb.watch') { return 'Facebook'; }
    return null;
  }

  private isDuplicateLink(lic: LicenseEntry, url: string): boolean {
    return Object.values(lic.campaignLinks ?? {})
      .some((link) => (link?.url ?? '').trim().toLowerCase() === url.toLowerCase());
  }

  get addLinkPlatformLabel(): string {
    return this.detectedPlatform ?? this.addLinkPlatformName.trim();
  }

  get canSaveAddLink(): boolean {
    if (this.addLinkPhase !== 'ready') { return false; }
    if (this.addLinkIssue === 'unknown-platform') { return !!this.addLinkPlatformName.trim(); }
    return true;
  }

  saveAddLink(): void {
    const lic = this.addLinkLicense;
    if (!lic || !this.canSaveAddLink) { return; }

    const url = this.addLinkUrl.trim();
    const label = this.addLinkPlatformLabel;
    const wasRestricted = this.addLinkIssue === 'restricted';
    this.addLinkPhase = 'saving';

    // TODO(backend): persist published links once the usage-links endpoint exists.
    window.setTimeout(() => {
      const key = this.storageKeyFor(label);
      lic.campaignLinks = { ...lic.campaignLinks, [key]: { url } };
      this.savedLinkPlatform = label;
      this.savedLinkUrl = url;
      this.savedLinkRestricted = wasRestricted;
      this.addLinkPhase = 'saved';
    }, 400);
  }

  retryAddLink(): void {
    this.addLinkPhase = 'ready';
    this.addLinkIssue = null;
    this.onAddLinkInput();
  }

  /** Keep the known three on their own keys so existing icons still light up. */
  private storageKeyFor(label: string): CampaignPlatform {
    const lower = label.toLowerCase();
    if (lower.includes('youtube')) { return 'youtube'; }
    if (lower.includes('instagram')) { return 'instagram'; }
    return 'tiktok';
  }

  viewExistingLink(): void {
    const lic = this.addLinkLicense;
    if (!lic) { return; }
    const url = this.addLinkUrl.trim().toLowerCase();
    const match = Object.values(lic.campaignLinks ?? {})
      .find((link) => (link?.url ?? '').trim().toLowerCase() === url);
    if (match?.url) { window.open(match.url, '_blank', 'noopener'); }
  }

  private clearDetectTimer(): void {
    if (this.detectTimerId !== null) {
      clearTimeout(this.detectTimerId);
      this.detectTimerId = null;
    }
  }

  /** Solid download button colored by license tier. */
  getDownloadButtonClass(type: string): string {
    return 'dl-btn--' + this.getTierClass(type).replace('badge--', '');
  }
}
