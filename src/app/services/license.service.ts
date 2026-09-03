import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ICommonSuccessResponse } from '../interfaces/response/common.response';
import { ILicenseResult } from '../interfaces/response/projects.response';

/**
 * License management service for the "my-club" namespace.
 *
 * Handles license creation, retrieval, and deletion. Maintains an in-memory
 * cache of licensed tracks that is reconciled with the backend via loadLicenses().
 */
@Injectable({ providedIn: 'root' })
export class LicenseService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.API_URL}/${environment.VERSION}/my-club`;

  private readonly keepOnError = !environment.production;

  private licensedTracksSubject = new BehaviorSubject<any[]>([]);
  licensedTracks$ = this.licensedTracksSubject.asObservable();

  /**
   * Tier remembered per track at license time.
   *
   * ILicenseResult carries no price_id / price_temp, so a license row coming
   * back from GET /my-club/licenses/ cannot say which tier it belongs to and the
   * Licenses tab would fall back to the Artist Promo badge and colours. We keep
   * what the track said when it was licensed, keyed by the canonical trackKey.
   *
   * TODO(backend): drop this once the license rows expose the tier themselves —
   * resolveLicenseType() already prefers any server-provided value over this.
   */
  private static readonly TIER_STORAGE_KEY = 'acrylic.licenseTiers';
  private tierByTrackKey = new Map<string, string>(this.readTierStorage());

  /* ──────────────────────────── Licenses ──────────────────────────── */

  loadLicenses(): void {
    this.http.get<ICommonSuccessResponse<ILicenseResult[]>>(`${this.base}/licenses/`).pipe(
      catchError(() => of(null))
    ).subscribe((res) => {
      if (!res) { return; }
      const backendLicenses: ILicenseResult[] = Array.isArray(res) ? (res as any) : ((res as any).results ?? []);
      const current = this.licensedTracksSubject.getValue();
      const backendKeys = new Set(backendLicenses.map(l => this.trackKey(l)));
      const optimisticOnly = current.filter((t: any) => !backendKeys.has(this.trackKey(t)));
      this.licensedTracksSubject.next([...backendLicenses, ...optimisticOnly]);
    });
  }

  /** Add a license to the list (only called after backend confirms). */
  addLicensedTrack(license: any): void {
    const current = this.licensedTracksSubject.getValue();
    const key = this.trackKey(license);
    if (!current.some(t => this.trackKey(t) === key)) {
      this.licensedTracksSubject.next([license, ...current]);
    }
  }

  createLicense(trackUuid: string, extendedCommercialUse: boolean = false): Observable<ILicenseResult> {
    const payload = {
      track: trackUuid,
      extended_commercial_use: extendedCommercialUse,
    };

    console.log('[LicenseService] createLicense called', { trackUuid, extendedCommercialUse, payload });

    return this.http.post<ILicenseResult>(`${this.base}/licenses/`, payload);
  }

  /**
   * Marks a license as downloaded on the backend. Only after this does the
   * license show in GET /licenses/ (and thus in the Licenses tab / "licensed"
   * tag). Idempotent and safe to retry.
   */
  markDownloaded(licenseUuid: string): Observable<ILicenseResult> {
    return this.http.post<ILicenseResult>(`${this.base}/licenses/${licenseUuid}/mark-downloaded/`, {});
  }

  getLicenses(): Observable<ICommonSuccessResponse<ILicenseResult[]>> {
    return this.http.get<ICommonSuccessResponse<ILicenseResult[]>>(`${this.base}/licenses/`);
  }

  /** Optimistically remove a license from the list. */
  removeLicensedTrack(licenseUuid: string): void {
    const current = this.licensedTracksSubject.getValue();
    this.licensedTracksSubject.next(current.filter((l: any) => l.uuid !== licenseUuid));
  }

  /** Delete a license and update the local list. */
  deleteLicense(licenseUuid: string): Observable<any> {
    return this.http.delete(`${this.base}/licenses/${licenseUuid}/`).pipe(
      tap(() => this.removeLicensedTrack(licenseUuid)),
      catchError((err) => {
        console.warn('[LicenseService] deleteLicense failed', err);
        this.loadLicenses();
        return throwError(() => err);
      })
    );
  }

  /* ──────────────────────────── Tier memory ──────────────────────────── */

  /** Record the tier a track was licensed under, so the Licenses tab can show it. */
  rememberTier(track: any, tier: string): void {
    const key = this.trackKey(track);
    if (!key || !tier) { return; }
    this.tierByTrackKey.set(key, tier);
    this.writeTierStorage();
  }

  getRememberedTier(license: any): string | null {
    return this.tierByTrackKey.get(this.trackKey(license)) ?? null;
  }

  private readTierStorage(): [string, string][] {
    try {
      const raw = localStorage.getItem(LicenseService.TIER_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? Object.entries(parsed) : [];
    } catch {
      return [];
    }
  }

  private writeTierStorage(): void {
    try {
      localStorage.setItem(
        LicenseService.TIER_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(this.tierByTrackKey))
      );
    } catch {
      // Storage unavailable (private window, quota) — the in-memory map still works.
    }
  }

  /* ──────────────────────────── Helpers ──────────────────────────── */

  /**
   * Canonical identity for a track/license, shared by every component
   * so the same song always resolves to ONE key.
   */
  trackKey(f: any): string {
    const candidates = [f?.track_uuid, f?.uuid, f?.track_id, f?.id, f?.isrc, f?.spotify_id];
    for (const c of candidates) {
      if (c !== null && c !== undefined) {
        const s = String(c).trim();
        if (s.length && !s.startsWith('temp-')) { return s; }
      }
    }
    if (f?.track && typeof f.track === 'object') {
      const nested = this.trackKey(f.track);
      if (nested) { return nested; }
    }
    const name = (f?.track_name ?? f?.track_name_track ?? f?.name ?? '').toString().trim();
    const artist = (f?.artist_canonical ?? f?.artist ?? f?.artist_name ?? '').toString().trim();
    return `${name}::${artist}`.toLowerCase();
  }
}
