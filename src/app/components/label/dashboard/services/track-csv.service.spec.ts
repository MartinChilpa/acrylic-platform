import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { TrackCsvService } from './track-csv.service';

describe('TrackCsvService', () => {
  let service: TrackCsvService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(TrackCsvService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
