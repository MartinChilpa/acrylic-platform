import { TestBed } from '@angular/core/testing';

import { SimilarityUrlService } from './similarity-url.service';

describe('SimilarityUrlService', () => {
  let service: SimilarityUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimilarityUrlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
