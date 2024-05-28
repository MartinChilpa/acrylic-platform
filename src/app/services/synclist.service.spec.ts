import { TestBed } from '@angular/core/testing';

import { SynclistService } from './synclist.service';

describe('SynclistService', () => {
  let service: SynclistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SynclistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
