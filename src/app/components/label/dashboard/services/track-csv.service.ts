import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrackCsvService {
  private http = inject(HttpClient);
  API_URL = `${environment.API_URL}/${environment.VERSION}/ingestion`;

  uploadTrackCsvTracks(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<any>(`${this.API_URL}/upload_csv/`, formData);
  }

  sendArtistsWithSpotify(artistsWithSpotify: Array<{ name: string; spotify_url: string }>) {
    return this.http.post<any>(`${this.API_URL}/save_artists/`, {
      artists_with_spotify: artistsWithSpotify
    });
  }

  
}
