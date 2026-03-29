import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SimilarityUrlService {

  private http = inject(HttpClient);
  API_URL = `${environment.API_URL}/${environment.VERSION}/aims`;

  searchSimilarityByUrl(sourceUrl: string) {
    return this.http.post<any[]>(`${this.API_URL}/similarity/`, {
      youtube_url: sourceUrl,
      page: 1
    });
  }

  searchSimilarityByPrompt(text: string) {
    return this.http.post<any[]>(`${this.API_URL}/similarity-prompt/`, {
      text,
      page: 1,
      page_size: 50
    });
  }

  searchSimilarityByVideo(videoFile: File) {
    const formData = new FormData();
    formData.append('video_file', videoFile);
    formData.append('page', '1');
    return this.http.post<any[]>(`${this.API_URL}/similarity-video/`, formData);
  }
}
