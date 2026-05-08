import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { map } from 'rxjs/operators';

type DownloadUrlResponse = { url?: string | null };

@Injectable({
  providedIn: 'root'
})
export class AimsDownloadService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/${environment.VERSION}/aims`;

  /**
   * Backend must authenticate this request and return a presigned S3 URL that forces download
   * via `Content-Disposition: attachment`.
   *
   * Suggested backend endpoint: POST `${API_URL}/download-url/`
   * Body: { url?: string; key?: string; filename: string }
   * Response: { url: string }
   */
  getPresignedDownloadUrl(params: { url?: string; key?: string; filename: string }) {
    return this.http
      .post<DownloadUrlResponse>(`${this.API_URL}/download-url/`, params)
      .pipe(map((res) => (res?.url ?? '').toString()));
  }
}

