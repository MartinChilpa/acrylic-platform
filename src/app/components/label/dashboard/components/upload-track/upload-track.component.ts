import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AlertService } from '../../../../../services/alert.service';
import { TrackCsvService } from '../../services/track-csv.service';

@Component({
  selector: 'acrylic-upload-track',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './upload-track.component.html',
  styleUrl: './upload-track.component.scss'
})
export class UploadTrackComponent {
  private trackCsvService = inject(TrackCsvService);
  private alertService = inject(AlertService);

  artistsWithSpotify: Array<{ name: string; spotify_url: string }> = [];
  selectedFile: File | null = null;
  fileName: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isUploading = false;
  isSendingArtists = false;

  delimiter: ',' | ';' | '\t' | '|' = ',';
  hasHeaderRow = true;

  header: string[] = [];
  rows: string[][] = [];

  get previewRows(): string[][] {
    return this.rows.slice(0, 10);
  }

  get columnCount(): number {
    return Math.max(this.header.length, ...this.rows.map((r) => r.length), 0);
  }

  clear(): void {
    this.selectedFile = null;
    this.fileName = null;
    this.errorMessage = null;
    this.successMessage = null;
    this.header = [];
    this.rows = [];
    this.artistsWithSpotify = [];
    this.isSendingArtists = false;
  }

  async onFileInputChange(event: Event): Promise<void> {
    this.clear();

    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.errorMessage = 'El archivo debe ser .csv';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'El CSV es muy grande (máx. 10MB).';
      return;
    }

    try {
      const text = await file.text();
      const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = normalized.split('\n').filter((line) => line.trim().length > 0);

      if (!lines.length) {
        this.errorMessage = 'El CSV está vacío.';
        return;
      }

      this.delimiter = this.detectDelimiter(lines[0]);
      const parsed = lines.map((line) => this.parseCsvLine(line, this.delimiter));

      if (this.hasHeaderRow) {
        this.header = parsed[0].map((v) => v.trim());
        this.rows = parsed.slice(1);
      } else {
        this.header = [];
        this.rows = parsed;
      }

      if (!this.rows.length) {
        this.errorMessage = 'No hay filas de datos en el CSV.';
      }
    } catch (error) {
      this.errorMessage = (error as { message?: string })?.message ?? 'No se pudo leer el CSV.';
    }
  }

  onFileSelected(file: File) {
    if (!file || this.isUploading) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isUploading = true;

    this.trackCsvService.uploadTrackCsvTracks(file)
      .pipe(finalize(() => {
        this.isUploading = false;
      }))
      .subscribe({
        next: (res) => {
          const artistsWithSpotify: Array<{ name: string; spotify_url: string }> = res?.artists_with_spotify ?? [];
          console.log('artistsWithSpotify', artistsWithSpotify);
          this.artistsWithSpotify = artistsWithSpotify;
          this.successMessage = 'CSV cargado correctamente.';
          this.alertService.success('CSV cargado correctamente.');
        },
        error: () => {
          this.errorMessage = 'No se pudo subir el CSV.';
          this.alertService.error('No se pudo subir el CSV.');
        }
      });
  }

  sendArtistsToBackend(): void {
    if (!this.artistsWithSpotify.length || this.isSendingArtists) {
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isSendingArtists = true;

    this.trackCsvService.sendArtistsWithSpotify(this.artistsWithSpotify)
      .pipe(finalize(() => {
        this.isSendingArtists = false;
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Artists enviados correctamente.';
          this.alertService.success('Artists enviados correctamente.');
        },
        error: () => {
          this.errorMessage = 'No se pudieron enviar los artists.';
          this.alertService.error('No se pudieron enviar los artists.');
        }
      });
  }

  private detectDelimiter(firstLine: string): ',' | ';' | '\t' | '|' {
    const candidates: Array<',' | ';' | '\t' | '|'> = [',', ';', '\t', '|'];
    const counts = candidates.map((d) => ({ d, count: this.countDelimiterOutsideQuotes(firstLine, d) }));
    counts.sort((a, b) => b.count - a.count);
    return counts[0]?.count ? counts[0].d : ',';
  }

  private countDelimiterOutsideQuotes(line: string, delimiter: ',' | ';' | '\t' | '|'): number {
    let inQuotes = false;
    let count = 0;
    for (let index = 0; index < line.length; index++) {
      const ch = line[index];
      if (ch === '\"') {
        const next = line[index + 1];
        if (inQuotes && next === '\"') {
          index++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes && ch === delimiter) {
        count++;
      }
    }
    return count;
  }

  private parseCsvLine(line: string, delimiter: ',' | ';' | '\t' | '|'): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
      const ch = line[index];

      if (ch === '\"') {
        const next = line[index + 1];
        if (inQuotes && next === '\"') {
          current += '\"';
          index++;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && ch === delimiter) {
        result.push(current);
        current = '';
        continue;
      }

      current += ch;
    }

    result.push(current);
    return result;
  }
}
