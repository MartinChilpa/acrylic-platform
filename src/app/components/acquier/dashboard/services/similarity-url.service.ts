import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SimilarityUrlService {

  private http = inject(HttpClient);
  API_URL = `${environment.API_URL}/${environment.VERSION}/aims`

  searchSimilarity(youtubeUrl: string) {

    return this.http.post<any[]>(`${this.API_URL}/similarity/`, {
      youtube_url: youtubeUrl,
      page: 1
    });

  }

}