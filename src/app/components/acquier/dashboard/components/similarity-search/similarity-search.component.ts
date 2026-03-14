import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { switchMap, tap, catchError, distinctUntilChanged } from 'rxjs/operators';

import { SimilarityUrlService } from '../../services/similarity-url.service';

@Component({
  selector: 'acrylic-similarity-search',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './similarity-search.component.html',
  styleUrls: ['./similarity-search.component.scss']
})
export class SimilaritySearchComponent implements OnInit {
  private similarityService = inject(SimilarityUrlService);
  private youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  
  // 1. Un solo Control con validación de URL
  searchControl = new FormControl('', [
    Validators.pattern(this.youtubeUrlRegex)
  ]);

  // 2. Un "disparador" manual para el botón
  private manualSearch$ = new Subject<string>();
  
  results: any[] = [];
  loading = false;
  errorMsg: string | null = null;
ngOnInit() {
  // Ahora solo escuchamos el disparador manual del botón
  this.manualSearch$.pipe(
    distinctUntilChanged(),
    tap(() => {
      this.loading = true;
      this.errorMsg = null;
    }),
    switchMap(query =>
      this.similarityService.searchSimilarity(query).pipe(
        catchError(err => {
          this.errorMsg = 'Error en el servidor. Revisa la consola.';
          return of([]);
        })
      )
    )
  ).subscribe((data: unknown) => {
    this.results = this.normalizeResponse(data);
    this.loading = false;
  });
}
  // 4. El botón ahora solo "empuja" el valor al flujo existente
  search() {
    const query = (this.searchControl.value ?? '').trim();

    if (!query) {
      this.errorMsg = 'Pega una URL de YouTube.';
      return;
    }

    if (!this.youtubeUrlRegex.test(query)) {
      this.errorMsg = 'La URL no parece ser de YouTube.';
      return;
    }

    this.manualSearch$.next(query);
  }

  private normalizeResponse(data: unknown): any[] {
    return this.findArrayInPayload(data) ?? [];
  }

  private findArrayInPayload(value: unknown): any[] | null {
    if (Array.isArray(value)) {
      return value;
    }
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;

    for (const key of ['tracks', 'results', 'data', 'items', 'matches', 'payload']) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    for (const nested of Object.values(record)) {
      const found = this.findArrayInPayload(nested);
      if (found) {
        return found;
      }
    }

    return null;
  }

  getThumbnailPath(track: any): string | null {
    const thumbs = track?.thumbnails;
    if (!Array.isArray(thumbs) || thumbs.length === 0) {
      return null;
    }

    const preferred = thumbs.find((t: any) => t?.size === '80x80') ?? thumbs[0];
    return preferred?.path ?? null;
  }

  formatDuration(totalSeconds: number | null | undefined): string {
    if (typeof totalSeconds !== 'number' || Number.isNaN(totalSeconds) || totalSeconds < 0) {
      return '--:--';
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
}
