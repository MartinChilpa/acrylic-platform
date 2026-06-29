import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProjectsService } from '../../../../../services/projects.service';
import { LicenseService } from '../../../../../services/license.service';

/**
 * Self-contained replica of the similarity-search result row, reusable anywhere
 * (e.g. Projects → Saved Tracks). Manages its own audio playback + waveform and
 * shows whether the track is already licensed.
 */
@Component({
  selector: 'acrylic-track-row-projects',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './track-row-projects.component.html',
  styleUrls: ['./track-row-projects.component.scss'],
})
export class TrackRowProjectsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() track: any;

  @ViewChild('audioRef') private audioRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('waveOverviewRef') private waveOverviewRef?: ElementRef<HTMLDivElement>;

  private projectsService = inject(ProjectsService);
  private licenseService = inject(LicenseService);
  private subs = new Subscription();

  favorited = false;
  licensed = false;
  panelOpen = false;

  isPlaying = false;
  timerLabel = '0:00';
  waveformLoading = false;
  waveformError: string | null = null;

  private peaksInstance: any | null = null;
  private peaksLib: any | null = null;
  private rafId: number | null = null;

  private readonly dummyHighlights = [
    { offset: 25.088, duration: 45.72 },
    { offset: 94.208, duration: 44.184 },
    { offset: 169.472, duration: 18.072 }
  ];

  ngOnInit(): void {
    this.subs.add(this.projectsService.favorites$.subscribe((favs) => {
      const key = this.getTrackKey();
      this.favorited = favs.some(f => this.matchesKey(f, key));
    }));
    this.subs.add(this.licenseService.licensedTracks$.subscribe((tracks: any[]) => {
      const key = this.getTrackKey();
      this.licensed = tracks.some((t: any) => this.matchesKey(t, key));
    }));
  }

  ngAfterViewInit(): void {
    void this.initPeaks();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.stopTimer();
    this.destroyPeaks();
  }

  /* ---------- identity / state ---------- */

  getTrackKey(): string {
    return this.projectsService.trackKey(this.track);
  }

  private matchesKey(entry: any, key: string): boolean {
    return !!key && this.projectsService.trackKey(entry) === key;
  }

  toggleFavorite(): void {
    const key = this.getTrackKey();
    if (!key) { return; }
    this.projectsService.toggleFavorite(key, this.track).subscribe({ error: () => {} });
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
  }

  licenseTrack(): void {
    if (this.licensed) { return; }
    const key = this.getTrackKey();
    if (key) {
      this.licenseService.createLicense(key).subscribe({
        next: (result) => this.licenseService.addLicensedTrack(result),
        error: () => {}
      });
    }
  }

  getTrackLicensePrice(track: any): string | null {
    const raw = Number(track?.price ?? track?.license_price ?? track?.price_amount);
    if (!Number.isFinite(raw) || raw <= 0) { return null; }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(raw);
  }

  /* ---------- imagery / metadata ---------- */

  getTrackImage(track: any): string {
    const coverImage = track?.cover_image;
    if (typeof coverImage === 'string' && coverImage.trim().length > 0) {
      return coverImage;
    }
    return this.getThumbnailPath(track) ?? 'assets/images/others/default.jpg';
  }

  private getThumbnailPath(track: any): string | null {
    const thumbs = track?.thumbnails as Array<{ size?: string; path?: string }> | undefined;
    if (!Array.isArray(thumbs) || thumbs.length === 0) {
      return null;
    }
    const preferred = thumbs.find((t) => t?.size === '600x600')
      ?? thumbs.find((t) => t?.size === '80x80')
      ?? thumbs[0];
    return typeof preferred?.path === 'string' ? preferred.path : null;
  }

  getArtistCountryCode2(track: any): string | null {
    const code2 = (track?.artist_country_code2 ?? '').toString().trim().toUpperCase();
    return code2.length === 2 ? code2 : null;
  }

  getCountryFlagUrl(code2: string): string {
    const safe = (code2 ?? '').toString().trim().toLowerCase();
    return `https://flagcdn.com/16x12/${safe}.png`;
  }

  /* ---------- tier ---------- */

  private getPriceId(value: unknown): number | null {
    const n = Number((value as any)?.price_id ?? value);
    return Number.isFinite(n) ? n : null;
  }

  getTierLabel(track: any): string {
    const id = this.getPriceId(track);
    if (id === 1) return 'ArtistPromo';
    if (id === 2) return 'PreClear';
    if (id === 3) return 'Bid2Clear';
    return 'ArtistPromo';
  }

  getTierClass(track: any): string {
    const id = this.getPriceId(track);
    if (id === 1) return 'pt2-icon-tier--artistpromo';
    if (id === 3) return 'pt2-icon-tier--bid2clear';
    if (id === 2) return 'pt2-icon-tier--preclear';
    return 'pt2-icon-tier--artistpromo';
  }

  getResultThemeClass(track: any): string {
    const id = this.getPriceId(track);
    if (id === 1) return 'result-theme--artistpromo';
    if (id === 3) return 'result-theme--bid2clear';
    if (id === 2) return 'result-theme--preclear';
    return 'result-theme--artistpromo';
  }

  /* ---------- audience metrics ---------- */

  getAudienceSize(track: any): string | null {
    const total = this.getAudienceSizeValue(track);
    if (total === null) { return null; }
    return new Intl.NumberFormat('en-US').format(total);
  }

  private getAudienceSizeValue(track: any): number | null {
    const directCandidates: unknown[] = [
      track?.audience_size,
      track?.audience_size_total,
      track?.audience_total,
      track?.total_audience,
      track?.total_followers
    ];
    for (const value of directCandidates) {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) { return n; }
    }
    const values = [
      Number(track?.spotify_followers ?? 0),
      Number(track?.tiktok_followers ?? 0),
      Number(track?.youtube_followers ?? 0),
      Number(track?.instagram_followers ?? 0)
    ];
    const valid = values.filter((v) => Number.isFinite(v) && v > 0);
    if (!valid.length) { return null; }
    return valid.reduce((sum, v) => sum + v, 0);
  }

  getAudienceSizeIconPath(track: any): string {
    const total = this.getAudienceSizeValue(track);
    if (total === null) { return 'assets/images/icons/range/users-m.svg'; }
    if (total < 10_000) { return 'assets/images/icons/range/users-l.svg'; }
    if (total <= 100_000) { return 'assets/images/icons/range/users-m.svg'; }
    return 'assets/images/icons/range/users.h.svg';
  }

  getAudienceSportFitPercentage(track: any): number | null {
    const candidates: unknown[] = [
      track?.chartmetric_instagram_sports_fit_percent,
      track?.audience_sport_fit_percentage,
      track?.audience_sport_fit_percent,
      track?.audience_sport_fit,
      track?.sport_fit_percentage,
      track?.sport_fit_percent,
      track?.sport_fit,
      track?.sports_fit_percentage,
      track?.sports_fit_percent,
      track?.sports_fit
    ];
    for (const value of candidates) {
      const normalized = typeof value === 'string' ? value.replace('%', '').trim() : value;
      const n = Number(normalized);
      if (Number.isFinite(n)) {
        return Math.max(0, Math.min(100, Number(n.toFixed(1))));
      }
    }
    return null;
  }

  getSportFitIconPath(track: any): string {
    const percentage = this.getAudienceSportFitPercentage(track);
    if (percentage === null) { return 'assets/images/icons/volleyball.svg'; }
    if (percentage <= 33) { return 'assets/images/icons/range/volleyball-l.svg'; }
    if (percentage <= 66) { return 'assets/images/icons/range/volleyball-m.svg'; }
    return 'assets/images/icons/range/volleyball-h.svg';
  }

  getTrackViralityPercentage(track: any): number | null {
    const candidates: unknown[] = [
      track?.track_virality,
      track?.track_virality_percent,
      track?.virality,
      track?.virality_percent
    ];
    for (const value of candidates) {
      const normalized = typeof value === 'string' ? value.replace('%', '').trim() : value;
      const n = Number(normalized);
      if (Number.isFinite(n)) {
        return Math.max(0, Math.min(100, Number(n.toFixed(1))));
      }
    }
    return null;
  }

  getTrackViralityIconPath(track: any): string {
    const percentage = this.getTrackViralityPercentage(track);
    if (percentage === null) { return 'assets/images/icons/range/gauge-m.svg'; }
    if (percentage <= 33) { return 'assets/images/icons/range/gauge-l.svg'; }
    if (percentage <= 66) { return 'assets/images/icons/range/gauge-m.svg'; }
    return 'assets/images/icons/range/gauge-h.svg';
  }

  /* ---------- audio / waveform ---------- */

  getTrackAudioUrl(track: any): string | null {
    const source = track?.file_wav;
    return typeof source === 'string' && source.length > 0 ? source : null;
  }

  getTrackWaveformUrl(track: any): string | null {
    const source = track?.waveform ?? track?.waveform_url;
    return typeof source === 'string' && source.length > 0 ? source : null;
  }

  toggleTrackPlayback(): void {
    const audio = this.audioRef?.nativeElement;
    if (!audio) { return; }
    if (audio.paused) { audio.play(); } else { audio.pause(); }
  }

  onPlay(): void {
    this.isPlaying = true;
    this.startTimer();
  }

  onPause(): void {
    this.isPlaying = false;
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    const audio = this.audioRef?.nativeElement;
    if (!audio) { return; }
    const tick = () => {
      this.timerLabel = this.formatMmSs(audio.currentTime);
      if (!audio.paused && !audio.ended) {
        this.rafId = requestAnimationFrame(tick);
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopTimer(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private formatMmSs(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) { return '0:00'; }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private async initPeaks(): Promise<void> {
    const audioUrl = this.getTrackAudioUrl(this.track);
    const waveformUrl = this.getTrackWaveformUrl(this.track);
    const audioEl = this.audioRef?.nativeElement;
    const overviewEl = this.waveOverviewRef?.nativeElement;
    if (!audioUrl || !waveformUrl || !audioEl || !overviewEl) { return; }

    const Peaks = await this.getPeaksLib();
    this.waveformLoading = true;
    Peaks.init({
      overview: {
        container: overviewEl,
        waveformColor: '#ffffff',
        showAxisLabels: false
      },
      waveformColor: '#ffffff',
      playheadColor: '#023185',
      mediaElement: audioEl,
      dataUri: { json: waveformUrl },
      showPlayheadTime: false,
      keyboard: false
    }, (err: unknown, instance: any) => {
      this.waveformLoading = false;
      if (err || !instance) {
        this.waveformError = 'Failed to load waveform';
        return;
      }
      this.waveformError = null;
      this.peaksInstance = instance;
      this.applyHighlights(instance);
    });
  }

  private applyHighlights(instance: any): void {
    const highlights = this.getTrackHighlights(this.track);
    if (!highlights.length || !instance?.segments?.add) { return; }
    try {
      instance.segments.removeAll?.();
      instance.segments.add(
        highlights.map((item, index) => ({
          id: `highlight-${index}`,
          startTime: item.offset,
          endTime: item.offset + item.duration,
          labelText: `H${index + 1}`,
          color: 'rgba(2, 49, 133, 0.35)',
          editable: false
        }))
      );
    } catch {
      // no-op
    }
  }

  private getTrackHighlights(track: any): Array<{ offset: number; duration: number }> {
    const source = Array.isArray(track?.highlights) && track.highlights.length
      ? track.highlights
      : this.dummyHighlights;
    return source
      .map((item: unknown) => {
        if (!item || typeof item !== 'object') { return null; }
        const record = item as Record<string, unknown>;
        const offset = Number(record['offset']);
        const duration = Number(record['duration']);
        if (!Number.isFinite(offset) || !Number.isFinite(duration) || offset < 0 || duration <= 0) {
          return null;
        }
        return { offset, duration };
      })
      .filter((item: { offset: number; duration: number } | null): item is { offset: number; duration: number } => !!item);
  }

  private async getPeaksLib(): Promise<any> {
    if (this.peaksLib) { return this.peaksLib; }
    const module = await import('peaks.js');
    this.peaksLib = (module as any).default ?? module;
    return this.peaksLib;
  }

  private destroyPeaks(): void {
    try {
      this.peaksInstance?.destroy?.();
    } catch {
      // no-op
    }
    this.peaksInstance = null;
  }
}
