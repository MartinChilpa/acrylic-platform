import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export type PublishedLinkPlatform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'youtube_shorts'
  | 'facebook';

export interface TrackPublishedLink {
  uuid: string;
  track_uuid: string;
  track_id: number;
  track_name: string;
  platform: PublishedLinkPlatform;
  platform_display: string;
  url: string;
  created: string;
  updated: string;
}

export interface TrackPublishedLinksResponse {
  count: number;
  results: TrackPublishedLink[];
  by_platform: Record<PublishedLinkPlatform, TrackPublishedLink[]>;
}

export interface PublishedLinkDetection {
  url: string;
  valid: boolean;
  platform: PublishedLinkPlatform | null;
  platformDisplay: string | null;
}

export class PublishedLinkDetectionError extends Error {
  constructor(readonly code: 'invalid-url' | 'unsupported-platform') {
    super(code);
  }
}

@Injectable({ providedIn: 'root' })
export class TrackPublishedLinksService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.API_URL}/${environment.VERSION}/my-club/published-links/`;

  private readonly platformLabels: Record<PublishedLinkPlatform, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    youtube_shorts: 'YouTube Shorts',
    facebook: 'Facebook',
  };

  detect(url: string): PublishedLinkDetection {
    const normalized = url.trim();
    const parsed = this.parsePublishedUrl(normalized);
    if (!parsed) {
      return { url: normalized, valid: false, platform: null, platformDisplay: null };
    }

    const platform = this.detectPlatform(parsed);
    return {
      url: normalized,
      valid: true,
      platform,
      platformDisplay: platform ? this.platformLabels[platform] : null,
    };
  }

  createForTrack(trackUuid: string, url: string): Observable<TrackPublishedLink> {
    const detection = this.detect(url);
    if (!detection.valid) {
      return throwError(() => new PublishedLinkDetectionError('invalid-url'));
    }
    if (!detection.platform) {
      return throwError(() => new PublishedLinkDetectionError('unsupported-platform'));
    }

    return this.http.post<TrackPublishedLink>(this.endpoint, {
      track_uuid: trackUuid,
      platform: detection.platform,
      url: detection.url,
    });
  }

  list(filters?: { trackUuid?: string; platform?: PublishedLinkPlatform }): Observable<TrackPublishedLinksResponse> {
    let params = new HttpParams();
    if (filters?.trackUuid) { params = params.set('track_uuid', filters.trackUuid); }
    if (filters?.platform) { params = params.set('platform', filters.platform); }
    return this.http.get<TrackPublishedLinksResponse>(this.endpoint, { params });
  }

  update(uuid: string, changes: { url?: string; platform?: PublishedLinkPlatform }): Observable<TrackPublishedLink> {
    return this.http.patch<TrackPublishedLink>(`${this.endpoint}${uuid}/`, changes);
  }

  delete(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}${uuid}/`);
  }

  private parsePublishedUrl(url: string): URL | null {
    if (!/^https?:\/\//i.test(url)) { return null; }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) { return null; }
      if (!parsed.pathname || parsed.pathname === '/') { return null; }
      return parsed;
    } catch {
      return null;
    }
  }

  private detectPlatform(url: URL): PublishedLinkPlatform | null {
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const belongsTo = (domain: string): boolean => host === domain || host.endsWith(`.${domain}`);

    if (belongsTo('youtube.com') || host === 'youtu.be') {
      return /^\/shorts\//i.test(url.pathname) ? 'youtube_shorts' : 'youtube';
    }
    if (belongsTo('instagram.com')) { return 'instagram'; }
    if (belongsTo('tiktok.com')) { return 'tiktok'; }
    if (belongsTo('facebook.com') || host === 'fb.watch') { return 'facebook'; }
    return null;
  }
}
