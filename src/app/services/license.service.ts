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

  createLicense(trackUuid: string, extendedCommercialUse = false): Observable<ILicenseResult> {
    const payload: any = {
      track: trackUuid,
    };
    if (extendedCommercialUse) {
      payload.extended_commercial_use = true;
    }

    console.log('[LicenseService] createLicense called', { trackUuid, extendedCommercialUse, payload });

    return this.http.post<ILicenseResult>(`${this.base}/licenses/`, payload);
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
