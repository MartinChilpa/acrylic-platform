import { Component, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Subject, merge, of } from 'rxjs';
import { debounceTime, switchMap, tap, catchError, filter, distinctUntilChanged } from 'rxjs/operators';

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
  
  // 1. Un solo Control con validación de URL
  searchControl = new FormControl('', [
    Validators.pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
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
  ).subscribe(data => {
    this.results = data;
    this.loading = false;
  });
}
  // 4. El botón ahora solo "empuja" el valor al flujo existente
  search() {
    if (this.searchControl.valid && this.searchControl.value) {
      this.manualSearch$.next(this.searchControl.value);
    }
  }
}