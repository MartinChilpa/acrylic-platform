import { TestBed } from '@angular/core/testing';

import { TrackCsvService } from './track-csv.service';

describe('TrackCsvService', () => {
  let service: TrackCsvService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackCsvService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
