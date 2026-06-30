import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
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

  private uploadSimilarityVideo(videoFile: File) {
    const formData = new FormData();
    formData.append('video_file', videoFile);
    return this.http.post<{ hash: string }>(`${this.API_URL}/similarity-video-upload/`, formData, {
      // Do not set Content-Type manually for FormData uploads.
      // Angular / browser must generate the multipart boundary.
      headers: undefined
    });
  }

  private searchSimilarityByHash(hash: string, page: number = 1, pageSize: number = 10) {
    return this.http.post<any>(`${this.API_URL}/similarity-video-search/`, {
      hash,
      page,
      page_size: pageSize,
    });
  }

  searchSimilarityByVideo(videoFile: File, page: number = 1, pageSize: number = 10) {
    return this.uploadSimilarityVideo(videoFile).pipe(
      switchMap((response) => this.searchSimilarityByHash(response.hash, page, pageSize))
    );
  }
}
