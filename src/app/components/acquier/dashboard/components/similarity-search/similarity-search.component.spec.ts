import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SimilaritySearchComponent } from './similarity-search.component';

describe('SimilaritySearchComponent', () => {
  let component: SimilaritySearchComponent;
  let fixture: ComponentFixture<SimilaritySearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimilaritySearchComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SimilaritySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
