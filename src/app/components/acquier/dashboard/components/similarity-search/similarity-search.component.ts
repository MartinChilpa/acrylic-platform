import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormControl, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

import { SimilarityUrlService } from '../../services/similarity-url.service';

@Component({
  selector: 'acrylic-similarity-search',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './similarity-search.component.html',
  styleUrls: ['./similarity-search.component.scss']
})
export class SimilaritySearchComponent implements OnInit {
  private similarityService = inject(SimilarityUrlService);
  private sameQueryCooldownMs = 3000;
  private lastQuery = '';
  private lastQueryAt = 0;
  private supportedUrlValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) {
      return null;
    }
    return this.isSupportedMediaUrl(value) ? null : { unsupportedUrl: true };
  };
  
  // 1. Un solo Control con validación de URL
  searchControl = new FormControl('', [
    this.supportedUrlValidator
  ]);

  // 2. Un "disparador" manual para el botón
  private manualSearch$ = new Subject<string>();
  private peaksLib: any | null = null;
  private peaksInstances = new Map<string, any>();
  private waveformErrors = new Map<string, string>();
  
  results: any[] = [];
  globalFileWav: string | null = null;
  loading = false;
  errorMsg: string | null = null;
  @ViewChildren('audioRef') private audioRefs!: QueryList<ElementRef<HTMLAudioElement>>;
  @ViewChildren('waveOverviewRef') private waveOverviewRefs!: QueryList<ElementRef<HTMLDivElement>>;

ngOnInit() {
  // Ahora solo escuchamos el disparador manual del botón
  this.manualSearch$.pipe(
    tap(() => {
      this.loading = true;
      this.errorMsg = null;
    }),
    switchMap(query =>
      this.similarityService.searchSimilarity(query).pipe(
        catchError(err => {
          this.errorMsg = 'Error en el servidor. Revisa la consola.';
          return of([]);
        })
      )
    )
  ).subscribe((data: unknown) => {
    console.log('[similarity raw response]', data);
    this.destroyAllPeaks();
    this.waveformErrors.clear();
    this.globalFileWav = this.extractGlobalFileWav(data);
    this.results = this.normalizeResponse(data);
    this.loading = false;
    queueMicrotask(() => {
      this.initializePeaksForVisibleRows();
    });
  });
}

  ngAfterViewInit(): void {
    this.audioRefs.changes.subscribe(() => {
      this.initializePeaksForVisibleRows();
    });
    this.waveOverviewRefs.changes.subscribe(() => {
      this.initializePeaksForVisibleRows();
    });
  }

  ngOnDestroy(): void {
    this.destroyAllPeaks();
  }
  // 4. El botón ahora solo "empuja" el valor al flujo existente
  search() {
    const query = (this.searchControl.value ?? '').trim();

    if (!query) {
      this.errorMsg = 'Pega una URL de YouTube.';
      return;
    }

    if (!this.isSupportedMediaUrl(query)) {
      this.errorMsg = 'La URL no es compatible. Usa YouTube, Vimeo, SoundCloud, Spotify, Apple Music o TikTok.';
      return;
    }

    const now = Date.now();
    const isSameQuery = query === this.lastQuery;
    const withinCooldown = now - this.lastQueryAt < this.sameQueryCooldownMs;
    if (isSameQuery && withinCooldown) {
      this.errorMsg = `Espera ${Math.ceil((this.sameQueryCooldownMs - (now - this.lastQueryAt)) / 1000)}s para repetir la misma busqueda.`;
      return;
    }

    this.lastQuery = query;
    this.lastQueryAt = now;

    this.manualSearch$.next(query);
  }

  private normalizeResponse(data: unknown): any[] {
    return this.findArrayInPayload(data) ?? [];
  }

  private extractGlobalFileWav(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as Record<string, unknown>;
    return typeof record['file_wav'] === 'string' ? record['file_wav'] : null;
  }

  private findArrayInPayload(value: unknown): any[] | null {
    if (Array.isArray(value)) {
      return value;
    }
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;

    for (const key of ['tracks', 'results', 'data', 'items', 'matches', 'payload']) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    for (const nested of Object.values(record)) {
      const found = this.findArrayInPayload(nested);
      if (found) {
        return found;
      }
    }

    return null;
  }

  getThumbnailPath(track: any): string | null {
    const thumbs = track?.thumbnails as Array<{ size?: string; path?: string }> | undefined;
    if (!Array.isArray(thumbs) || thumbs.length === 0) {
      return null;
    }

    const preferred = thumbs.find((t) => t?.size === '600x600')
      ?? thumbs.find((t) => t?.size === '80x80')
      ?? thumbs[0];

    return typeof preferred?.path === 'string' ? preferred.path : null;
  }

  getTrackImage(track: any): string {
    return this.getThumbnailPath(track) ?? 'assets/images/others/default.jpg';
  }

  formatDuration(totalSeconds: number | null | undefined): string {
    if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds) || totalSeconds < 0) {
      return '--:--';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  getTrackKey(track: any, index: number): string {
    return (track?.id ?? track?.uuid ?? index).toString();
  }

  getTrackAudioUrl(track: any): string | null {
    const source = track?.file_wav ?? this.globalFileWav;
    return typeof source === 'string' && source.length > 0 ? source : null;
  }

  getTrackWaveformUrl(track: any): string | null {
    const source = track?.waveform ?? track?.waveform_url;
    return typeof source === 'string' && source.length > 0 ? source : null;
  }

  getWaveformError(track: any, index: number): string | null {
    return this.waveformErrors.get(this.getTrackKey(track, index)) ?? null;
  }

  private async initializePeaksForVisibleRows(): Promise<void> {
    if (!this.results.length) {
      return;
    }

    const Peaks = await this.getPeaksLib();

    this.results.forEach((track, index) => {
      const key = this.getTrackKey(track, index);
      if (this.peaksInstances.has(key)) {
        return;
      }

      const audioUrl = this.getTrackAudioUrl(track);
      const waveformUrl = this.getTrackWaveformUrl(track);
      if (!audioUrl || !waveformUrl) {
        return;
      }

      const audioElement = this.audioRefs?.find(ref => ref.nativeElement.dataset['trackKey'] === key)?.nativeElement;
      const overviewElement = this.waveOverviewRefs?.find(ref => ref.nativeElement.dataset['trackKey'] === key)?.nativeElement;
      if (!audioElement || !overviewElement) {
        return;
      }

      Peaks.init({
        overview: {
          container: overviewElement,
          waveformColor: '#9ee9ff'
        },
        waveformColor: '#9ee9ff',
        playheadColor: '#ff4d6d',
        mediaElement: audioElement,
        dataUri: {
          json: waveformUrl
        },
        showPlayheadTime: false,
        keyboard: false
      }, (err: unknown, peaksInstance: any) => {
        if (err || !peaksInstance) {
          const message = err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: unknown }).message ?? 'Failed to load waveform')
            : 'Failed to load waveform';
          this.waveformErrors.set(key, message);
          return;
        }
        this.waveformErrors.delete(key);
        this.peaksInstances.set(key, peaksInstance);
      });
    });
  }

  private async getPeaksLib(): Promise<any> {
    if (this.peaksLib) {
      return this.peaksLib;
    }
    const module = await import('peaks.js');
    this.peaksLib = module.default ?? module;
    return this.peaksLib;
  }

  private destroyAllPeaks(): void {
    this.peaksInstances.forEach((instance) => {
      try {
        instance?.destroy?.();
      } catch {
        // no-op
      }
    });
    this.peaksInstances.clear();
  }

  private isSupportedMediaUrl(inputUrl: string): boolean {
    let url = inputUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname;

      if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')) {
        return true;
      }

      if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'vimeopro.com' || host === 'www.vimeopro.com') {
        return true;
      }

      if (host === 'i.vimeocdn.com' && path.startsWith('/video/')) {
        return true;
      }

      if (host === 'soundcloud.com' || host === 'www.soundcloud.com') {
        return true;
      }

      if (host === 'w.soundcloud.com' && path.startsWith('/player/')) {
        return true;
      }

      if (host === 'api.soundcloud.com' && path.startsWith('/tracks/')) {
        return true;
      }

      if (host === 'open.spotify.com' && (path.startsWith('/track/') || path.startsWith('/embed/track/'))) {
        return true;
      }

      if (host === 'music.apple.com') {
        return true;
      }

      if ((host === 'tiktok.com' || host === 'www.tiktok.com') && /\/@[^/]+\/video\/\d+/.test(path)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}
