import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  searchSimilarityByVideo(videoFile: File, page: number = 1, pageSize: number = 10) {
    const formData = new FormData();
    formData.append('video_file', videoFile);
    formData.append('page', String(page));
    formData.append('page_size', String(pageSize));
    return this.http.post<any[]>(`${this.API_URL}/similarity-video/`, formData);
  }
}
