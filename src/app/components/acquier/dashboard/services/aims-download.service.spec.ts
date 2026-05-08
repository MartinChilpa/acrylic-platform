import { TestBed } from '@angular/core/testing';

import { AimsDownloadService } from './aims-download.service';

describe('AimsDownloadService', () => {
  let service: AimsDownloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AimsDownloadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

