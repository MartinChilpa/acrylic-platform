import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, EMPTY } from 'rxjs';
import { filter, map, switchMap, mergeMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SimilarityUrlService {

  private http = inject(HttpClient);
  API_URL = `${environment.API_URL}/${environment.VERSION}/aims`;

  searchSimilarityByUrl(sourceUrl: string, page: number = 1, pageSize: number = 10) {
    return this.http.post<any[]>(`${this.API_URL}/similarity/`, {
      youtube_url: sourceUrl,
      link: sourceUrl,
      page,
      page_size: pageSize
    });
  }

  searchSimilarityByPrompt(text: string, page: number = 1, pageSize: number = 10) {
    return this.http.post<any[]>(`${this.API_URL}/similarity-prompt/`, {
      text,
      page,
      page_size: pageSize
    });
  }

  /**
   * Upload the file using the AIMS contract. Uses `file` as the multipart field
   * and includes `X-User-Id` header when available. Returns upload events so
   * callers can track progress.
   */
  private uploadSimilarityVideo(videoFile: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('video_file', videoFile);

    return this.http.post<any>(`${this.API_URL}/similarity-video-upload/`, formData, {
      // Let the browser set the Content-Type boundary.
      reportProgress: true,
      observe: 'events'
    });
  }

  private searchSimilarityByHash(hash: string, page: number = 1, pageSize: number = 10) {
    return this.http.post<any>(`${this.API_URL}/similarity-video-search/`, {
      hash,
      page,
      page_size: pageSize,
    });
  }

  /**
   * Legacy endpoint: single-call upload+search. Returns the same similarity
   * response shape as the split flow.
   */
  searchSimilarityByVideoLegacy(videoFile: File, page: number = 1, pageSize: number = 10) {
    const fd = new FormData();
    fd.append('video_file', videoFile);
    fd.append('page', String(page));
    fd.append('page_size', String(pageSize));
    return this.http.post<any>(`${this.API_URL}/similarity-video/`, fd);
  }

  /**
   * Upload with progress, then run search and emit either progress objects
   * `{ progress: number }` or final `{ results }` object. Useful for UI.
   */
  uploadAndSearchWithProgress(videoFile: File, page: number = 1, pageSize: number = 10): Observable<any> {
    return this.uploadSimilarityVideo(videoFile).pipe(
      mergeMap((ev) => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) {
          return of({ progress: Math.round(100 * (ev.loaded / ev.total)) });
        }
        if (ev.type === HttpEventType.Response) {
          const hash = (ev as HttpResponse<any>).body?.hash ?? '';
          return this.searchSimilarityByHash(hash, page, pageSize).pipe(
            map((res) => ({ results: res }))
          );
        }
        return EMPTY;
      })
    );
  }

  /** Upload then search. Waits for the upload `HttpResponse` to extract the hash. */
  searchSimilarityByVideo(videoFile: File, page: number = 1, pageSize: number = 10) {
    return this.uploadSimilarityVideo(videoFile).pipe(
      filter((ev: HttpEvent<any>): ev is HttpResponse<any> => ev.type === HttpEventType.Response),
      map((ev: HttpResponse<any>) => (ev.body?.hash ?? (ev as any).hash ?? '')),
      switchMap((hash: string) => this.searchSimilarityByHash(hash, page, pageSize))
    );
  }
}
